// Excel del Consolidado de Cartera con los MISMOS valores ya formateados que se ven en pantalla (col.render) y el mismo
// color por grupo que el PDF (consolidadoPdf.js). Recibe las columnas y grupos de la página para no duplicar la
// definición de la tabla. Por defecto arma el consolidado por ETAPA de Baía Kristal.
//
// Nombre del archivo: "Consolidado Cartera - <Mes del consolidado> - exportado <AAAA-MM-DD>.xlsx" (igual que el PDF).
import ExcelJS from 'exceljs';

const EXCEL_BORDE_GRUPO = { left: { style: 'medium', color: { argb: 'FFC3CBD6' } } };
const EXCEL_BG_TOTAL = 'FFEEF1F5';
const fillSolida = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

// AAAA-MM-DD en hora de Bogotá (no la del equipo, para que el nombre sea el mismo para todos).
function fechaBogota(fecha = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

export function nombreArchivoConsolidadoExcel(etiquetaMes, prefijo = 'Consolidado Cartera', fecha = new Date()) {
  const mes = String(etiquetaMes || 'sin mes').replace(/[\\/:*?"<>|]/g, '').trim();
  return `${prefijo} - ${mes} - exportado ${fechaBogota(fecha)}.xlsx`;
}

export async function exportarConsolidadoExcel({
  datos, columnas, grupos, tonos, etiquetaEtapa,
  encabezadoPrimera = 'ETAPA',
  filasDatos = datos.etapas,
  etiquetaFila = (fila) => etiquetaEtapa(fila.etapa),
  prefijoArchivo = 'Consolidado Cartera',
}) {
  const inicioDeGrupo = new Set(grupos.map((_, i) => columnas[grupos.slice(0, i).reduce((s, g) => s + g.span, 0)]?.key));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Consolidado');

  ws.getColumn(1).width = 30;
  columnas.forEach((_, i) => { ws.getColumn(i + 2).width = 20; });

  ws.mergeCells(1, 1, 2, 1);
  const primera = ws.getCell(1, 1);
  primera.value = encabezadoPrimera;
  primera.font = { bold: true };
  primera.alignment = { vertical: 'middle', horizontal: 'left' };

  let cursor = 2;
  grupos.forEach((g) => {
    const inicio = cursor;
    const fin = cursor + g.span - 1;
    if (fin > inicio) ws.mergeCells(1, inicio, 1, fin);
    const cell = ws.getCell(1, inicio);
    cell.value = g.label.toUpperCase();
    cell.fill = fillSolida(tonos[g.tono].bg);
    cell.font = { bold: true, color: { argb: tonos[g.tono].ink } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cursor = fin + 1;
  });

  columnas.forEach((col, i) => {
    const g = grupos[col.grupo];
    const cell = ws.getCell(2, i + 2);
    cell.value = col.label;
    cell.fill = fillSolida(tonos[g.tono].bg);
    cell.font = { bold: true, color: { argb: tonos[g.tono].ink }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if (inicioDeGrupo.has(col.key)) cell.border = EXCEL_BORDE_GRUPO;
  });
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 34;

  const filas = [...filasDatos, datos.total];
  filas.forEach((fila, idx) => {
    const esTotal = idx === filas.length - 1;
    const row = ws.getRow(idx + 3);
    const celdaPrimera = row.getCell(1);
    celdaPrimera.value = esTotal ? 'TOTAL GENERAL' : etiquetaFila(fila);
    celdaPrimera.font = { bold: true };
    if (esTotal) celdaPrimera.fill = fillSolida(EXCEL_BG_TOTAL);

    columnas.forEach((col, i) => {
      const g = grupos[col.grupo];
      const cell = row.getCell(i + 2);
      cell.value = col.render(fila);
      cell.alignment = { horizontal: 'center' };
      if (esTotal) {
        cell.fill = fillSolida(EXCEL_BG_TOTAL);
        cell.font = { bold: true };
      } else {
        cell.fill = fillSolida(tonos[g.tono].bg);
        cell.font = { color: { argb: tonos[g.tono].ink } };
      }
      if (inicioDeGrupo.has(col.key)) cell.border = EXCEL_BORDE_GRUPO;
    });
  });

  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoConsolidadoExcel(datos.etiqueta, prefijoArchivo);
  a.click();
  URL.revokeObjectURL(url);
}
