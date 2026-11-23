import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Eye, EyeOff, FileSpreadsheet, Landmark, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import styles from './LoginPage.module.css';

// Mismo diseno que el login del HRMS (migracion de diseno 2026-10-05): panel de
// marca con foto, velo azul y el logo en blanco, y una tarjeta de acceso con
// iconos en los campos y boton para ver la contrasena. El titular es un SLOGAN,
// no el nombre de la app. `/login-hero.jpg` es una foto aerea real del skyline
// de Cartagena (Bocagrande, donde operan los proyectos de AED) -- Wikimedia
// Commons, Bernard Gagnon, CC BY-SA 4.0.
const BENEFICIOS = [
  { icono: Building2, texto: 'Inventario y negocios' },
  { icono: Landmark, texto: 'Fiducia y recaudo' },
  { icono: FileSpreadsheet, texto: 'Cartera en mora y resumen' },
];

// Login del portal (ruta absoluta del gateway, fuera del prefijo de esta app) y vuelta a Cartera despues de entrar.
const URL_LOGIN_PORTAL = `/login?next=${encodeURIComponent(import.meta.env.BASE_URL)}`;

export function LoginPage() {
  const { login, modo, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const perfil = await login(email, password);
      if (perfil.debe_cambiar_password) {
        navigate('/cambiar-password', { replace: true });
      } else {
        navigate(location.state?.from?.pathname ?? '/', { replace: true });
      }
    } catch (err) {
      setError(err.message ?? 'Credenciales incorrectas');
    } finally {
      setEnviando(false);
    }
  }

  // Con el portal obligatorio Cartera ya no tiene login propio: se manda directo al del portal. Solo si vive bajo un prefijo detras del
  // gateway (/cartera/): abierta por su propio dominio, `/login` seria esta misma pantalla y el redireccionamiento daria vueltas.
  // Antes de redirigir se pregunta al PORTAL si hay sesion: si no la hay, a su login (sin mensajes). Si la hay y Cartera igual no la
  // reconocio, redirigir daria vueltas sin fin (el portal devolveria a Cartera); ahi solo se explica.
  const detrasDelPortal = import.meta.env.BASE_URL !== '/';
  const [sesionPortalValida, setSesionPortalValida] = useState(false);
  useEffect(() => {
    if (cargando || modo !== 'required' || !detrasDelPortal) return undefined;
    let activo = true;
    fetch('/portal/api/me', { credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .then((valida) => {
        if (!activo) return;
        if (valida) setSesionPortalValida(true);
        else window.location.replace(URL_LOGIN_PORTAL);
      });
    return () => {
      activo = false;
    };
  }, [cargando, modo, detrasDelPortal]);
  if (cargando || (modo === 'required' && detrasDelPortal && !sesionPortalValida)) return null;
  if (sesionPortalValida) {
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Cartera no pudo validar tu sesión</h1>
          <p style={{ margin: '0 0 16px', color: 'var(--color-ink-secondary)' }}>
            Tu sesión del portal es válida, pero Cartera no pudo verificarla. Intenta de nuevo en unos minutos; si sigue igual, avisa a TI.
          </p>
          <a href="/">Volver al portal</a>
        </div>
      </div>
    );
  }
  if (modo === 'required') {
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p>
          Cartera se abre desde el portal: <a href="https://portal.aed-it.com">portal.aed-it.com</a>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.splitWrap}>
      {/* backgroundImage inline (no en el CSS module) -- una url('/login-hero.jpg')
          absoluta en CSS no se reescribe con el `base` de Vite cuando la app
          vive bajo un subpath (gateway de Plataforma AED); import.meta.env.BASE_URL
          si refleja ese `base`. Las DOS capas (velo + foto) van juntas en el
          mismo inline style: un style inline pisa por completo el
          background-image que pondria el CSS del module. */}
      <div
        className={styles.brandPanel}
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(11, 45, 77, 0.94) 0%, rgba(20, 48, 143, 0.82) 55%, rgba(35, 43, 237, 0.7) 100%), url('${import.meta.env.BASE_URL}login-hero.jpg')`,
        }}
        aria-hidden="true"
      >
        <img className={styles.brandLogo} src={`${import.meta.env.BASE_URL}aed-logo.png`} alt="" />
        <div className={styles.brandTextBlock}>
          <h2 className={styles.brandHeadline}>Cada peso de tu cartera, bajo control.</h2>
          <p className={styles.brandSubtext}>Ventas, planes de pago y recaudo de los proyectos inmobiliarios de AED — todo en un solo sistema.</p>
          <ul className={styles.benefits}>
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto}>
                <Icono size={16} strokeWidth={1.75} />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.formPanel}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <img className={styles.formLogo} src={`${import.meta.env.BASE_URL}aed-logo.png`} alt="aed" />
          <div className={styles.formHead}>
            <h1 className={styles.formTitle}>Te damos la bienvenida</h1>
            <p className={styles.formSubtitle}>Ingresa con tu correo y contraseña para continuar.</p>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <span className={styles.inputWrap}>
              <Mail size={18} strokeWidth={1.75} className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="email"
                autoComplete="username"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Contraseña</span>
            <span className={styles.inputWrap}>
              <Lock size={18} strokeWidth={1.75} className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </span>
          </label>

          {error && (
            <p className={styles.alert} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
          {modo === 'optional' && (
            <button type="button" className={styles.portal} onClick={() => window.location.assign(URL_LOGIN_PORTAL)}>
              Entrar con el portal AED
            </button>
          )}

          <p className={styles.footnote}>¿Problemas para ingresar? Escribe al administrador del sistema.</p>
        </form>
      </div>
    </div>
  );
}
