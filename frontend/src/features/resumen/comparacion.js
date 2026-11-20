// Comparación del TOTAL del Consolidado contra el mes anterior (pantalla, Excel y PDF usan estas mismas cuentas).
// Δ en la unidad de cada columna (los % se restan en puntos porcentuales); Δ % relativo. Sin fecha de corte.
const CLAVES_PCT = new Set(['pctRecaudoSobreVentasFiduciaria', 'pctRecaudoSobreCuotaInicial', 'pctCarteraMas5Dias']);
const CLAVES_UNIDADES = new Set(['uniTotales', 'uniVendidasFidu', 'uniVendidas', 'uniDisponible']);
const MM = 1_000_000_000;

const signo = (n) => (n > 0 ? '+' : n < 0 ? '−' : '');
const num1 = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num3 = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const valido = (key, a, b) => key !== 'fechaCorte' && a != null && b != null && !isNaN(a) && !isNaN(b);

// Δ: { texto, n } con n = signo/valor redondeado a lo que se ve (0 = igual, null = no aplica).
export function deltaTexto(key, a, b) {
  if (!valido(key, a, b)) return { texto: '—', n: null };
  const d = a - b;
  const abs = Math.abs(d);
  if (CLAVES_PCT.has(key)) { const n = Math.round(d * 1000) / 10; return { texto: `${signo(n)}${num1(abs * 100)} pp`, n }; }
  if (CLAVES_UNIDADES.has(key)) return { texto: `${signo(d)}${abs.toLocaleString('es-CO')}`, n: d };
  const n = Math.round(d / 1e6) / 1e3;
  return { texto: `${signo(n)}$${num3(abs / MM)}`, n };
}

// Δ %: relativo al mes anterior; no aplica a las columnas de porcentaje ni a la fecha.
export function deltaPctTexto(key, a, b) {
  if (!valido(key, a, b) || CLAVES_PCT.has(key)) return { texto: '—', n: null };
  if (b === 0) return a === 0 ? { texto: '0,0%', n: 0 } : { texto: '—', n: null };
  const p = ((a - b) / Math.abs(b)) * 100;
  const n = Math.round(p * 10) / 10;
  return { texto: `${signo(n)}${num1(Math.abs(p))}%`, n };
}

// Para Excel: valor numérico real + formato de celda (null si no aplica).
const F_UNI = '+#,##0;-#,##0;0';
const F_MM = '+"$" #,##0.000;-"$" #,##0.000;"$" 0.000';
const F_PP = '+0.0" pp";-0.0" pp";0.0" pp"';
const F_PCT = '+0.0%;-0.0%;0.0%';
export function deltaExcel(key, a, b) {
  if (!valido(key, a, b)) return null;
  const d = a - b;
  if (CLAVES_PCT.has(key)) return { valor: d * 100, fmt: F_PP, n: Math.round(d * 1000) / 10 };
  if (CLAVES_UNIDADES.has(key)) return { valor: d, fmt: F_UNI, n: d };
  return { valor: d / MM, fmt: F_MM, n: Math.round(d / 1e6) / 1e3 };
}
export function deltaPctExcel(key, a, b) {
  if (!valido(key, a, b) || CLAVES_PCT.has(key)) return null;
  if (b === 0) return a === 0 ? { valor: 0, fmt: F_PCT, n: 0 } : null;
  const v = (a - b) / Math.abs(b);
  return { valor: v, fmt: F_PCT, n: Math.round(v * 1000) / 10 };
}
