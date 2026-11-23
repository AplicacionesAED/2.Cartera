// requireAuth va PRIMERO en toda ruta protegida (incluidas las de solo
// lectura). requireAdmin/requireModulo van DESPUES, solo en rutas
// restringidas -- ver ARQUITECTURA-BACKEND.md, "Login y autenticación" y
// "Roles y permisos dinámicos".
const crypto = require('crypto');
const { decodeToken, ACCESS_COOKIE_NAME } = require('../utils/security');
const portalAuth = require('../utils/portalAuth');
const ApiError = require('../utils/ApiError');
const Usuario = require('../modules/usuario/usuario.model');
const { tienePermiso, getRolesPermisos, resolverEsAdmin } = require('../utils/permisos');

function esRutaPermitidaConCambioPendiente(originalUrl) {
  const ruta = String(originalUrl).split('?')[0];
  return /\/api\/auth\//.test(ruta) || /\/api\/usuarios\/me$/.test(ruta);
}

// Nombre de esta app en el portal (el portal le da acceso a la gente con este nombre).
const APP_PORTAL = 'cartera';

// Lee el access_token de la cookie httpOnly, decodifica el JWT y adjunta el
// usuario activo a req.usuario. Los permisos se re-leen de la BD (nunca se
// confia en el claim del JWT) para que un token manipulado no pueda escalar
// privilegios ni sobrevivir a un cambio de roles/desactivacion. `esAdmin` se
// resuelve aca UNA VEZ por request contra roles.es_admin (no contra el
// string 'ADMIN') -- pedido explicito del usuario (2026-09-18): renombrar
// ese rol no debe romper el bypass de administrador de nadie.
async function requireAuthInterno(req, res, next) {
  // Con el portal activo (PORTAL_AUTH=optional|required) la identidad sale de la sesion del portal: aqui solo se busca a la persona por
  // su correo y se le aplican los roles y permisos de esta app (que siguen siendo de Cartera). `optional` cae al login propio si no hay
  // sesion del portal; `required` no. Quien entra por el portal no usa la contraseña de Cartera: su cambio pendiente no lo frena
  // (`viaPortal`, ver getMe en usuario.service.js).
  const modo = portalAuth.modo();
  if (modo !== 'off') {
    const sesion = await portalAuth.resolverSesion(req, APP_PORTAL);
    const usuarioPortal = sesion.estado === 'ok' ? await Usuario.findOne({ where: { email: sesion.email, activo: true } }) : null;
    if (usuarioPortal) {
      usuarioPortal.esAdmin = await resolverEsAdmin(usuarioPortal.roles);
      usuarioPortal.viaPortal = true;
      req.usuario = usuarioPortal;
      return next();
    }

    // Sin entrar por el portal: en `optional`, quien ya tiene su sesion propia sigue con ella (que el portal no le de la app no debe
    // sacarlo de lo que ya usa durante la transicion); en `required` no hay otra puerta.
    const conSesionPropia = modo === 'optional' && Boolean(req.cookies?.[ACCESS_COOKIE_NAME]);
    if (!conSesionPropia) {
      if (sesion.estado === 'cambiar-password') return next(new ApiError(403, 'Debes cambiar tu contraseña en el portal antes de continuar'));
      if (sesion.estado === 'sin-acceso') return next(new ApiError(403, 'El portal no te da acceso a Cartera. Pide acceso a TI.'));
      if (sesion.estado === 'ok') return next(new ApiError(403, 'Tienes acceso en el portal, pero aún no existe un usuario de Cartera para tu correo. Pide a un administrador que lo cree.'));
      return next(new ApiError(401, 'No autenticado'));
    }
  }

  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) return next(new ApiError(401, 'No autenticado'));

  let payload;
  try {
    payload = decodeToken(token);
  } catch {
    return next(new ApiError(401, 'Token invalido o expirado'));
  }
  if (payload.type !== 'access') return next(new ApiError(401, 'Token invalido'));

  const usuario = await Usuario.findOne({ where: { email: payload.sub, activo: true } });
  if (!usuario) return next(new ApiError(401, 'Usuario no encontrado'));

  // Cambio de contraseña pendiente (cuenta nueva o contraseña temporal
  // regenerada): hasta que lo haga, solo puede usar las rutas de /auth y leer su
  // propio perfil. Sin esto la pantalla "Crea tu contraseña" era solo una
  // sugerencia: con la sesión ya abierta se podía entrar a cualquier módulo y la
  // contraseña temporal quedaba vigente.
  if (usuario.debe_cambiar_password && !esRutaPermitidaConCambioPendiente(req.originalUrl)) {
    return next(new ApiError(403, 'Debes cambiar tu contraseña antes de continuar', { codigo: 'CAMBIO_PASSWORD_PENDIENTE' }));
  }

  usuario.esAdmin = await resolverEsAdmin(usuario.roles);

  req.usuario = usuario;
  next();
}

// Express 4 no captura los rechazos de un middleware async: un fallo de base de
// datos aquí (pool agotado, conexión caída) dejaba la petición colgada y, en
// Node 20, tumbaba el proceso entero por "unhandled rejection". Se envuelve
// para que cualquier error vaya a next(err) y responda como error normal.
const requireAuth = (req, res, next) => requireAuthInterno(req, res, next).catch(next);

// Restringido a esAdmin (ver la nota de requireAuth).
function requireAdmin(req, res, next) {
  if (!req.usuario?.esAdmin) return next(new ApiError(403, 'Acceso restringido a administradores'));
  next();
}

// Acepta una clave sola o un array -- basta con tener acceso a UNA de las
// claves dadas. Los permisos por rol se leen EN VIVO de la tabla `roles` en
// cada request (getRolesPermisos), asi un permiso editado desde Accesos >
// Roles aplica de inmediato sin relogin.
function requireModulo(claveOClaves) {
  const claves = Array.isArray(claveOClaves) ? claveOClaves : [claveOClaves];
  return (req, res, next) =>
    getRolesPermisos()
      .then((permisosPorRol) => {
        if (claves.some((c) => tienePermiso(req.usuario?.roles, c, permisosPorRol, req.usuario?.esAdmin))) return next();
        return next(new ApiError(403, 'No tienes permiso para este modulo'));
      })
      .catch(next);
}

// SOLO para la subida automática de archivos de la fiduciaria (n8n, todos los días ~12:00 hora de Colombia): acepta
// o bien la sesión normal de un usuario con el módulo, o bien la cabecera `X-API-Key` igual a la variable de entorno
// INTEGRACION_API_KEY. La llave NO abre ninguna otra ruta. Si la variable no está definida (o tiene menos de 32
// caracteres) la vía por llave queda deshabilitada. Comparación en tiempo constante.
function requireAuthOIntegracion(claveOClaves) {
  const exigirModulo = requireModulo(claveOClaves);
  return (req, res, next) => {
    const recibida = req.get('x-api-key');
    if (!recibida) return requireAuth(req, res, (err) => (err ? next(err) : exigirModulo(req, res, next)));
    const esperada = process.env.INTEGRACION_API_KEY;
    if (!esperada || esperada.length < 32) return next(new ApiError(401, 'La integración por API key no está configurada'));
    const a = Buffer.from(recibida);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return next(new ApiError(401, 'API key inválida'));
    req.usuario = { id: null, nombre: 'Integración (n8n)', roles: ['INTEGRACION'], esAdmin: false, integracion: true };
    return next();
  };
}

module.exports = { requireAuth, requireAdmin, requireModulo, requireAuthOIntegracion };
