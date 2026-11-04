// Cotización aceptada de un negocio de Oliv, traída de Centro-Aplicaciones-Comerciales-AED (el Cotizador de Cuotas)
// por su endpoint de integración de solo lectura (GET /api/integracion/cotizaciones/aceptadas, cabecera X-API-Key) --
// nunca se lee su base de datos ni se escribe nada allá. Antes se leía la tabla `quotes` directo
// (pedido explícito del usuario, 2026-09-11: "vamos a conectarnos a la base de datos que usa Centro Aplicaciones
// Comerciales"); se cambió al endpoint (2026-11-04) porque esa app ya cambió de esquema (tabla `cotizaciones`) y
// porque el endpoint entrega además la información financiera ya calculada (valor del apartamento, parqueadero,
// descuentos, bono y total).
//
// La respuesta ya viene en la forma que usa Cartera (plan de pago, saldo contraentrega, parqueadero/depósito/cuarto
// útil, contactoSnapshot e informacionFinanciera): `mapCotizacion` solo se conserva para los módulos que ya la llaman.
// `dealId` = el mismo id de HubSpot que OlivOportunidad guarda como `hubspot_id`.
const axios = require('axios');

const TIMEOUT_MS = 15000;

function configurado() {
  return !!(process.env.CENTRO_APLICACIONES_URL && process.env.CENTRO_APLICACIONES_API_KEY);
}

// { [dealId]: cotización } con la aceptada más reciente de cada negocio; los que no tienen no aparecen. {} si la
// conexión no está configurada (el módulo sigue funcionando sin esto, simplemente no muestra plan de pago).
async function getCotizacionesAceptadas(dealIds) {
  const ids = [...new Set((dealIds ?? []).filter(Boolean).map(String))];
  if (!configurado() || !ids.length) return {};
  const base = process.env.CENTRO_APLICACIONES_URL.replace(/\/+$/, '');
  const { data } = await axios.get(`${base}/api/integracion/cotizaciones/aceptadas`, {
    params: { dealIds: ids.join(',') },
    headers: { 'X-API-Key': process.env.CENTRO_APLICACIONES_API_KEY },
    timeout: TIMEOUT_MS,
  });
  return data?.data ?? {};
}

// Cotización aceptada más reciente de un negocio -- null si no hay ninguna, o si la conexión no está configurada.
async function getCotizacionAceptada(dealId) {
  if (!dealId) return null;
  const porNegocio = await getCotizacionesAceptadas([dealId]);
  return porNegocio[String(dealId)] ?? null;
}

// La respuesta del endpoint ya está mapeada: se devuelve tal cual (null si no hay cotización).
function mapCotizacion(cotizacion) {
  return cotizacion ?? null;
}

module.exports = { configurado, getCotizacionesAceptadas, getCotizacionAceptada, mapCotizacion };
