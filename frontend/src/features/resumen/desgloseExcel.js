// Hoja única del Consolidado con desglose: por cada etapa su fila de resumen (las columnas del Consolidado) y debajo uno
// por inmueble con las MISMAS columnas, más Frente/Torre/Unidad/Referencia de recaudo/Comprador. Todo en pesos completos
// (número, no texto) para poder filtrar y sumar. Las filas de inmueble quedan agrupadas (se pueden plegar).
//
// Cada inmueble aporta por separado; el Consolidado netea por etapa (pendiente = max(0, ventas − recaudo)). Por eso la
// última columna "Saldo a favor" trae lo que pagó de más cada negocio: Σ pendiente − Σ saldo a favor = pendiente de la etapa.
const FORMATO_PESOS = '#,##0';
const FORMATO_UNIDADES = '#,##0';
const FORMATO_DINERO = '"$" #,##0';
const FORMATO_FECHA = 'dd/mm/yyyy';
const FORMATO_PCT = '0.0%';
const EXCEL_BORDE_GRUPO = { left: { style: 'medium', color: { argb: 'FFC3CBD6' } } };
const BG_TOTAL = 'FFEEF1F5';
const fillSolida = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const CLAVES_PCT = new Set(['pctRecaudoSobreVentasFiduciaria', 'pctRecaudoSobreCuotaInicial', 'pctCarteraMas5Dias']);
const UMBRAL_CARTERA_DIAS = 5;

const ID_COLUMNAS = [
  { label: 'Etapa / Frente', ancho: 30 },
  { label: 'Torre', ancho: 8 },
  { label: 'Unidad', ancho: 10 },
  { label: 'Referencia de recaudo', ancho: 20 },
  { label: 'Comprador', ancho: 32 },
];

// Valor de cada columna del Consolidado para un inmueble (mismas definiciones, a nivel de un solo inmueble).
function valorInmueble(key, u) {
  const vendida = u.estado === 'Vendida';
  switch (key) {
    case 'uniTotales': return 1;
    case 'uniVendidasFidu': return vendida ? 1 : 0;
    case 'uniDisponible': return vendida ? 0 : 1;
    case 'valorTotalUnidadesDisponibles': return vendida ? null : u.valorUnidadDisponible ?? 0;
    case 'valorTotalVentasFiduciaria': return vendida ? u.valorVenta : null;
    case 'valorCuotasIniciales': return vendida ? u.cuotaInicial : null;
    case 'valorTotalVenta': return vendida ? u.valorVenta : u.valorUnidadDisponible ?? 0;
    case 'recaudoReal': return vendida ? u.recaudado : null;
    case 'recaudoCuotaInicial': return vendida ? u.recaudadoCuotaInicial : null;
    case 'recaudoCredito': return vendida ? u.recaudadoCredito : null;
    case 'pctRecaudoSobreVentasFiduciaria': return vendida && u.valorVenta > 0 ? u.recaudado / u.valorVenta : null;
    case 'pctRecaudoSobreCuotaInicial': return vendida && u.cuotaInicial > 0 ? u.recaudadoCuotaInicial / u.cuotaInicial : null;
    case 'pendienteTotalFiduciaria': return vendida ? u.pendienteTotal : null;
    case 'pendienteCuotaInicial': return vendida ? u.pendienteCuotaInicial : null;
    case 'pendienteCredito': return vendida ? Math.max(0, u.pendienteCredito) : null;
    case 'carteraMas5Dias': return vendida ? ((u.maxDiasAtrasoInicial ?? 0) > UMBRAL_CARTERA_DIAS ? u.montoEnMoraInicial ?? 0 : 0) : null;
    default: return null; // % cartera y fecha de corte solo existen por etapa
  }
}

export function valorResumen(key, fila) {
  if (key === 'fechaCorte') return fila.fechaCorte ? new Date(fila.fechaCorte) : null;
  const v = fila[key];
  return v == null || isNaN(v) ? null : v;
}

// Cada columna con su formato real: unidades = entero, % = porcentaje, fecha = fecha, el resto = dinero.
const CLAVES_UNIDADES = new Set(['uniTotales', 'uniVendidasFidu', 'uniVendidas', 'uniDisponible']);
export const formatoDe = (key) => {
  if (CLAVES_PCT.has(key)) return FORMATO_PCT;
  if (key === 'fechaCorte') return FORMATO_FECHA;
  return CLAVES_UNIDADES.has(key) ? FORMATO_UNIDADES : FORMATO_DINERO;
};

// Vencimiento por cliente (después de "Saldo a favor"): qué sigue sin pagar y qué tan tarde pagó lo pagado.
const EXTRA_COLUMNAS = [
  { label: 'Fecha límite vencida más antigua (sin pagar)', fmt: 'dd/mm/yyyy', ancho: 22 },
  { label: 'Días de vencimiento actual (sin pagar)', fmt: FORMATO_PESOS, ancho: 18 },
  { label: 'Máx. días de atraso al pagar (fecha del pago − fecha límite)', fmt: FORMATO_PESOS, ancho: 24 },
];
const fechaUtc = (iso) => (iso ? new Date(`${iso}T00:00:00Z`) : null);
function extrasInmueble(u) {
  if (u.estado !== 'Vendida') return EXTRA_COLUMNAS.map(() => null);
  return [fechaUtc(u.fechaLimiteVencidaMasAntigua), u.diasVencimientoActual, u.maxDiasAtrasoAlPagar];
}
// Fila de etapa o total: sin fecha; días = el mayor.
function extrasAgregado(lista) {
  const v = lista.filter((u) => u.estado === 'Vendida');
  return [null, Math.max(0, ...v.map((u) => u.diasVencimientoActual ?? 0)), Math.max(0, ...v.map((u) => u.maxDiasAtrasoAlPagar ?? 0))];
}

export function agregarHojaConsolidadoDetallado(wb, { datos, columnas, grupos, tonos, unidades, etiquetaEtapa }) {
  const ws = wb.addWorksheet('Consolidado');
  const nId = ID_COLUMNAS.length;
  const colFavor = nId + columnas.length + 1;
  const inicioDeGrupo = new Set(grupos.map((_, i) => columnas[grupos.slice(0, i).reduce((s, g) => s + g.span, 0)]?.key));

  ID_COLUMNAS.forEach((c, i) => { ws.getColumn(i + 1).width = c.ancho; });
  columnas.forEach((_, i) => { ws.getColumn(nId + i + 1).width = 20; });
  ws.getColumn(colFavor).width = 22;
  EXTRA_COLUMNAS.forEach((c, i) => { ws.getColumn(colFavor + 1 + i).width = c.ancho; });

  // Encabezados: fila 1 = grupos, fila 2 = columnas (igual que el Consolidado).
  ws.mergeCells(1, 1, 2, 1);
  const primera = ws.getCell(1, 1);
  primera.value = ID_COLUMNAS[0].label;
  primera.font = { bold: true };
  primera.alignment = { vertical: 'middle', horizontal: 'left' };
  ID_COLUMNAS.slice(1).forEach((c, i) => {
    ws.mergeCells(1, i + 2, 2, i + 2);
    const cell = ws.getCell(1, i + 2);
    cell.value = c.label;
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  let cursor = nId + 1;
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
    const cell = ws.getCell(2, nId + i + 1);
    cell.value = col.label;
    cell.fill = fillSolida(tonos[g.tono].bg);
    cell.font = { bold: true, color: { argb: tonos[g.tono].ink }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if (inicioDeGrupo.has(col.key)) cell.border = EXCEL_BORDE_GRUPO;
  });
  ws.mergeCells(1, colFavor, 2, colFavor);
  const hFavor = ws.getCell(1, colFavor);
  hFavor.value = 'Saldo a favor (pagó de más)';
  hFavor.font = { bold: true, size: 10 };
  hFavor.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  EXTRA_COLUMNAS.forEach((c, i) => {
    ws.mergeCells(1, colFavor + 1 + i, 2, colFavor + 1 + i);
    const h = ws.getCell(1, colFavor + 1 + i);
    h.value = c.label;
    h.font = { bold: true, size: 10 };
    h.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 48;

  const porEtapa = new Map();
  for (const u of unidades) {
    if (!porEtapa.has(u.etapa)) porEtapa.set(u.etapa, []);
    porEtapa.get(u.etapa).push(u);
  }

  let r = 3;
  const escribirFila = (fila, { etiqueta, esResumen, esTotal, inmueble, valorColumna, favor, extras }) => {
    const row = ws.getRow(r++);
    const c1 = row.getCell(1);
    c1.value = etiqueta;
    if (esResumen || esTotal) c1.font = { bold: true };
    if (inmueble) {
      c1.alignment = { indent: 1 };
      row.getCell(2).value = inmueble.torre == null ? null : String(inmueble.torre);
      row.getCell(3).value = inmueble.unidad ?? null;
      row.getCell(4).value = inmueble.referencia ?? null;
      row.getCell(5).value = inmueble.comprador ?? null;
      row.outlineLevel = 1;
    }
    columnas.forEach((col, i) => {
      const g = grupos[col.grupo];
      const cell = row.getCell(nId + i + 1);
      cell.value = valorColumna(col.key);
      cell.numFmt = formatoDe(col.key);
      cell.alignment = { horizontal: 'right' };
      if (esTotal) { cell.fill = fillSolida(BG_TOTAL); cell.font = { bold: true }; }
      else if (esResumen) { cell.fill = fillSolida(tonos[g.tono].bg); cell.font = { bold: true, color: { argb: tonos[g.tono].ink } }; }
      if (inicioDeGrupo.has(col.key)) cell.border = EXCEL_BORDE_GRUPO;
    });
    const cf = row.getCell(colFavor);
    cf.value = favor;
    cf.numFmt = FORMATO_DINERO;
    cf.alignment = { horizontal: 'right' };
    extras.forEach((v, i) => {
      const ce = row.getCell(colFavor + 1 + i);
      ce.value = v;
      ce.numFmt = EXTRA_COLUMNAS[i].fmt;
      ce.alignment = { horizontal: 'right' };
      if (esResumen) ce.font = { bold: true };
    });
    const ultima = colFavor + EXTRA_COLUMNAS.length;
    if (esTotal) { for (let k = 1; k <= ultima; k++) { const c = row.getCell(k); c.fill = fillSolida(BG_TOTAL); c.font = { bold: true }; } }
    else if (esResumen) { for (let k = 1; k <= nId; k++) row.getCell(k).fill = fillSolida(BG_TOTAL); cf.font = { bold: true }; }
  };

  for (const fila of datos.etapas) {
    const lista = porEtapa.get(fila.etapa) ?? [];
    escribirFila(fila, {
      etiqueta: etiquetaEtapa(fila.etapa), esResumen: true,
      valorColumna: (key) => valorResumen(key, fila),
      favor: lista.reduce((s, u) => s + (u.saldoAFavor ?? 0), 0),
      extras: extrasAgregado(lista),
    });
    for (const u of lista) {
      escribirFila(u, {
        etiqueta: u.frente ?? '', inmueble: u,
        valorColumna: (key) => valorInmueble(key, u),
        favor: u.estado === 'Vendida' ? u.saldoAFavor : null,
        extras: extrasInmueble(u),
      });
    }
  }
  escribirFila(datos.total, {
    etiqueta: 'TOTAL GENERAL', esTotal: true,
    valorColumna: (key) => valorResumen(key, datos.total),
    favor: unidades.reduce((s, u) => s + (u.saldoAFavor ?? 0), 0),
    extras: extrasAgregado(unidades),
  });

  ws.properties.outlineProperties = { summaryBelow: false };
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }];
  return ws;
}
