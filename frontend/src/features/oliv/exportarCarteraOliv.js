// Excel de la tabla de Cartera en Gestión de Oliv (vista Cuota Inicial) del Resumen: las mismas 20 columnas, en el mismo
// orden y con los mismos valores que se ven en pantalla, pero como números y fechas reales (se pueden ordenar y sumar).
import ExcelJS from 'exceljs';

const COLOR = { encabezado: 'FF1B21A6', texto: 'FFFFFFFF', filaImpar: 'FFF8FAFC', filaPar: 'FFFFFFFF' };
const MONEDA = '#,##0';

// [encabezado, ancho, valor(fila), formato, alineación]
const COLUMNAS = [
  ['FECHA DE VENTA', 16, (f) => (f.fechaContrato ? new Date(f.fechaContrato) : null), 'dd/mm/yyyy', 'center'],
  ['ETAPA', 28, (f) => f.estado ?? '', null, 'left'],
  ['TORRE', 12, (f) => f.torre ?? '', null, 'left'],
  ['NOMENCLATURA', 16, (f) => f.unidad ?? '', null, 'left'],
  ['ÁREA (M²)', 12, (f) => f.area ?? null, '#,##0.00', 'center'],
  ['COMPRADOR', 34, (f) => f.comprador ?? '', null, 'left'],
  ['TIPO DE IDENTIFICACIÓN', 22, (f) => f.tipoIdentificacion ?? '', null, 'left'],
  ['IDENTIFICACIÓN', 18, (f) => f.identificacion ?? '', null, 'left'],
  ['PAÍS DE RESIDENCIA', 20, (f) => f.paisResidencia ?? '', null, 'left'],
  ['DEPARTAMENTO DE RESIDENCIA', 26, (f) => f.departamentoResidencia ?? '', null, 'left'],
  ['TELÉFONO', 16, (f) => f.telefono ?? '', null, 'left'],
  ['CORREO ELECTRÓNICO', 32, (f) => f.email ?? '', null, 'left'],
  ['VALOR TOTAL DEL NEGOCIO', 22, (f) => f.valorInmueble ?? null, MONEDA, 'center'],
  ['VALOR TOTAL DEL INMUEBLE', 22, (f) => f.valorApartamento ?? null, MONEDA, 'center'],
  ['VALOR DEL PARQUEADERO', 20, (f) => f.valorParqueadero ?? null, MONEDA, 'center'],
  ['ABONADO TOTAL', 18, (f) => f.totalAbonado ?? 0, MONEDA, 'center'],
  ['% RECIBIDO TOTAL', 16, (f) => f.pctRecaudo ?? null, '0.0"%"', 'center'],
  ['POR RECIBIR', 18, (f) => f.porRecibir ?? null, MONEDA, 'center'],
  ['VALOR DE CONTADO', 20, (f) => f.valorCuotaInicial ?? null, MONEDA, 'center'],
  ['VALOR CRÉDITO', 20, (f) => f.credito ?? null, MONEDA, 'center'],
];

export async function descargarCarteraOliv(filas, nombreArchivo) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Informe de Ventas');
  const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  COLUMNAS.forEach(([, ancho], i) => { ws.getColumn(i + 1).width = ancho; });

  const encabezado = ws.getRow(1);
  COLUMNAS.forEach(([titulo, , , , alinear], i) => {
    const celda = encabezado.getCell(i + 1);
    celda.value = titulo;
    celda.fill = relleno(COLOR.encabezado);
    celda.font = { bold: true, color: { argb: COLOR.texto }, size: 11 };
    celda.alignment = { vertical: 'middle', horizontal: alinear === 'left' ? 'left' : 'center', wrapText: true };
  });
  encabezado.height = 30;

  filas.forEach((fila, idx) => {
    const row = ws.getRow(idx + 2);
    const fondo = relleno(idx % 2 === 1 ? COLOR.filaImpar : COLOR.filaPar);
    COLUMNAS.forEach(([, , valor, formato, alinear], i) => {
      const celda = row.getCell(i + 1);
      celda.value = valor(fila);
      if (formato) celda.numFmt = formato;
      celda.alignment = { vertical: 'middle', horizontal: alinear === 'left' ? 'left' : 'center' };
      celda.fill = fondo;
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNAS.length } };

  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
