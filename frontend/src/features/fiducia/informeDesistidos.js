// Informe mensual de desistidos de Baía Kristal: SOLO los movimientos de tipo DESISTIMIENTOS cuya fecha contable cae en
// el mes elegido (los trae el mismo endpoint de exportación de Movimientos, con ese tipo y el rango del mes).
// Un desistimiento llega como varios movimientos del mismo negocio, y el comentario de la fiducia dice de qué es cada
// uno ("Aportes ...", "GMF ...", "Penalidad ..."): el resumen agrupa por negocio y separa esos tres conceptos.
// Los valores llegan negativos (es plata que sale); en el resumen se muestran en positivo como "devuelto".
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cleanNombre, shortFideicomiso } from './MovimientosTabla.jsx';

export const TIPO_DESISTIMIENTO = 'DESISTIMIENTOS';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function etiquetaMes(mes) {
  const [anio, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} ${anio}`;
}

// 'AAAA-MM' de la fecha contable de un movimiento (en UTC, como se guarda), o null si no tiene.
export function mesDeFecha(fecha) {
  return fecha ? new Date(fecha).toISOString().slice(0, 7) : null;
}

const numero = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

function concepto(comentario) {
  const palabra = String(comentario ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  if (palabra === 'aportes') return 'aportes';
  if (palabra === 'gmf') return 'gmf';
  if (palabra === 'penalidad') return 'penalidad';
  return 'otros';
}

const iso = (f) => (f ? new Date(f).toISOString().slice(0, 10) : '');
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

// Arma el resumen por negocio y el detalle a partir de los movimientos que devuelve el endpoint.
export function construirInforme(movimientos) {
  const porNegocio = new Map();
  const detalle = [];
  for (const mov of movimientos) {
    const neg = mov.negocio;
    const clave = neg?.enlaceId ?? `mov-${mov.id}`;
    const valor = Math.abs(numero(mov.datos?.Valor));
    const tipo = concepto(mov.datos?.Comentarios);
    const referencia = mov.referencia && mov.referencia !== '*' ? mov.referencia : '';

    if (!porNegocio.has(clave)) {
      porNegocio.set(clave, {
        proyecto: neg?.fideicomiso ? shortFideicomiso(neg.fideicomiso) : '',
        nomenclatura: neg?.nomenclatura ?? '',
        comprador: (neg?.compradores || []).map((c) => cleanNombre(c.nombre)).filter(Boolean).join(' | '),
        referencia: '',
        estado: neg?.estado ?? '',
        movimientos: 0, aportes: 0, gmf: 0, penalidad: 0, otros: 0, total: 0,
        primero: null, ultimo: null,
      });
    }
    const fila = porNegocio.get(clave);
    if (!fila.referencia && referencia) fila.referencia = referencia;
    fila.movimientos += 1;
    fila[tipo] += valor;
    fila.total += valor;
    const f = iso(mov.fechaContable);
    if (f && (!fila.primero || f < fila.primero)) fila.primero = f;
    if (f && (!fila.ultimo || f > fila.ultimo)) fila.ultimo = f;

    detalle.push({
      fecha: iso(mov.fechaContable),
      referencia,
      comprador: fila.comprador,
      nomenclatura: fila.nomenclatura,
      concepto: { aportes: 'Aportes', gmf: 'GMF', penalidad: 'Penalidad', otros: 'Otros' }[tipo],
      valor: numero(mov.datos?.Valor),
      comentarios: mov.datos?.Comentarios ?? '',
      razones: mov.datos?.['Razones / Justificaciones'] ?? '',
    });
  }

  const resumen = [...porNegocio.values()].sort((a, b) => (a.primero ?? '').localeCompare(b.primero ?? '') || a.nomenclatura.localeCompare(b.nomenclatura, 'es', { numeric: true }));
  detalle.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nomenclatura.localeCompare(b.nomenclatura, 'es', { numeric: true }));
  const total = resumen.reduce((t, r) => {
    t.movimientos += r.movimientos; t.aportes += r.aportes; t.gmf += r.gmf; t.penalidad += r.penalidad; t.otros += r.otros; t.total += r.total;
    return t;
  }, { movimientos: 0, aportes: 0, gmf: 0, penalidad: 0, otros: 0, total: 0 });
  return { resumen, detalle, total };
}

const hayOtros = (informe) => informe.total.otros > 0;

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

const fechaHoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const nombreArchivo = (mes, ext) => `Informe de desistidos - ${etiquetaMes(mes)} - exportado ${fechaHoy()}.${ext}`;
const subtitulo = (informe) => `${informe.resumen.length} negocios · ${informe.total.movimientos} movimientos · Total devuelto $${Math.round(informe.total.total).toLocaleString('es-CO')}`;

const AZUL = 'FF232BED';
const GRIS_TOTAL = 'FFEEF1F5';

export async function exportarInformeDesistidosExcel({ mes, movimientos }) {
  const informe = construirInforme(movimientos);
  const conOtros = hayOtros(informe);
  const wb = new ExcelJS.Workbook();
  const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  const cabecera = (row) => row.eachCell((c) => {
    c.fill = fill(AZUL);
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Hoja 1: resumen por negocio
  const ws = wb.addWorksheet('Resumen por negocio');
  const columnas = [
    ['Proyecto', 30], ['Nomenclatura', 16], ['Comprador(es)', 36], ['Referencia', 20], ['Estado negocio', 18], ['Mov.', 8],
    ['Aportes devueltos', 20], ['GMF', 14], ['Penalidades', 18], ...(conOtros ? [['Otros', 16]] : []),
    ['Total desistido', 20], ['Primer mov.', 14], ['Último mov.', 14],
  ];
  ws.addRow([`INFORME DE DESISTIDOS — ${etiquetaMes(mes)} — Baía Kristal`]).font = { bold: true, size: 14 };
  ws.addRow([subtitulo(informe)]).font = { color: { argb: 'FF64748B' } };
  ws.addRow([]);
  const encabezado = ws.addRow(columnas.map(([t]) => t));
  cabecera(encabezado);
  encabezado.height = 30;
  columnas.forEach(([, ancho], i) => { ws.getColumn(i + 1).width = ancho; });

  const filaDe = (r) => [
    r.proyecto, r.nomenclatura, r.comprador, r.referencia, r.estado, r.movimientos,
    r.aportes, r.gmf, r.penalidad, ...(conOtros ? [r.otros] : []), r.total, r.primero ? fechaCorta(r.primero) : '', r.ultimo ? fechaCorta(r.ultimo) : '',
  ];
  const primeraNum = 7; // columna de "Aportes devueltos"
  const ultimaNum = primeraNum + (conOtros ? 4 : 3);
  informe.resumen.forEach((r) => {
    const row = ws.addRow(filaDe(r));
    for (let c = primeraNum; c <= ultimaNum; c += 1) row.getCell(c).numFmt = '#,##0';
  });
  const total = ws.addRow(['TOTAL GENERAL', '', '', '', '', informe.total.movimientos, informe.total.aportes, informe.total.gmf, informe.total.penalidad, ...(conOtros ? [informe.total.otros] : []), informe.total.total, '', '']);
  total.eachCell({ includeEmpty: true }, (c) => { c.font = { bold: true }; c.fill = fill(GRIS_TOTAL); });
  for (let c = primeraNum; c <= ultimaNum; c += 1) total.getCell(c).numFmt = '#,##0';
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // Hoja 2: detalle de cada movimiento
  const wd = wb.addWorksheet('Detalle');
  const enc2 = wd.addRow(['Fecha contable', 'Referencia', 'Comprador(es)', 'Nomenclatura', 'Concepto', 'Valor', 'Comentarios', 'Razones / Justificaciones']);
  cabecera(enc2);
  enc2.height = 24;
  [14, 20, 36, 16, 14, 18, 70, 40].forEach((a, i) => { wd.getColumn(i + 1).width = a; });
  informe.detalle.forEach((d) => {
    const row = wd.addRow([d.fecha ? fechaCorta(d.fecha) : '', d.referencia, d.comprador, d.nomenclatura, d.concepto, d.valor, d.comentarios, d.razones]);
    row.getCell(6).numFmt = '#,##0';
  });
  wd.views = [{ state: 'frozen', ySplit: 1 }];
  wd.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };

  const buffer = await wb.xlsx.writeBuffer();
  descargar(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo(mes, 'xlsx'));
}

export function exportarInformeDesistidosPdf({ mes, movimientos }) {
  const informe = construirInforme(movimientos);
  const conOtros = hayOtros(informe);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const cop = (v) => `$${Math.round(v).toLocaleString('es-CO')}`;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Informe de desistidos — ${etiquetaMes(mes)} — Baía Kristal`, 8, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(subtitulo(informe), 8, 19.5);

  const head = [['Proyecto', 'Nomenclatura', 'Comprador(es)', 'Referencia', 'Mov.', 'Aportes devueltos', 'GMF', 'Penalidades', ...(conOtros ? ['Otros'] : []), 'Total desistido', 'Primer mov.', 'Último mov.']];
  const body = informe.resumen.map((r) => [
    r.proyecto, r.nomenclatura, r.comprador, r.referencia, String(r.movimientos), cop(r.aportes), cop(r.gmf), cop(r.penalidad),
    ...(conOtros ? [cop(r.otros)] : []), cop(r.total), r.primero ? fechaCorta(r.primero) : '', r.ultimo ? fechaCorta(r.ultimo) : '',
  ]);
  const t = informe.total;
  const foot = [['TOTAL GENERAL', '', '', '', String(t.movimientos), cop(t.aportes), cop(t.gmf), cop(t.penalidad), ...(conOtros ? [cop(t.otros)] : []), cop(t.total), '', '']];
  const primeraNum = 5;
  const estilosNum = {};
  for (let c = primeraNum; c < head[0].length - 2; c += 1) estilosNum[c] = { halign: 'right' };

  autoTable(doc, {
    startY: 24,
    head, body, foot,
    theme: 'grid',
    margin: { left: 8, right: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [35, 43, 237], textColor: 255, halign: 'center' },
    footStyles: { fillColor: [238, 241, 245], textColor: 20, fontStyle: 'bold' },
    columnStyles: estilosNum,
    showFoot: 'lastPage',
  });

  doc.save(nombreArchivo(mes, 'pdf'));
}
