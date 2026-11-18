// Hojas de desglose del Consolidado (una fila por inmueble, con la referencia de recaudo). Se agregan al mismo libro
// del Consolidado. Los valores van como número en pesos completos (no en miles de millones) para poder filtrar y sumar.
const FORMATO_PESOS = '#,##0';
const fillSolida = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const ENCABEZADO_BG = 'FFE8E9FD';
const ENCABEZADO_INK = 'FF232BED';
const TOTAL_BG = 'FFEEF1F5';

const COLUMNAS_TODAS = [
  { key: 'etapa', label: 'Etapa', ancho: 18 },
  { key: 'frente', label: 'Frente', ancho: 16 },
  { key: 'torre', label: 'Torre', ancho: 8 },
  { key: 'unidad', label: 'Unidad', ancho: 10 },
  { key: 'estado', label: 'Estado', ancho: 12 },
  { key: 'referencia', label: 'Referencia de recaudo', ancho: 20 },
  { key: 'comprador', label: 'Comprador', ancho: 34 },
  { key: 'valorUnidadDisponible', label: 'Valor unidad disponible', dinero: true },
  { key: 'valorVenta', label: 'Valor venta fiduciaria', dinero: true },
  { key: 'cuotaInicial', label: 'Valor cuota inicial', dinero: true },
  { key: 'recaudado', label: 'Recaudado a la fecha', dinero: true },
  { key: 'recaudadoCuotaInicial', label: 'Recaudado cuota inicial', dinero: true },
  { key: 'recaudadoCredito', label: 'Recaudado crédito', dinero: true },
  { key: 'pendienteTotal', label: 'Pendiente por recaudar', dinero: true },
  { key: 'saldoAFavor', label: 'Saldo a favor (pagó de más)', dinero: true },
  { key: 'pendienteCuotaInicial', label: 'Cuota inicial por recaudar', dinero: true },
  { key: 'pendienteCredito', label: 'Crédito por recaudar', dinero: true },
  { key: 'montoEnMoraInicial', label: 'Mora cuota inicial', dinero: true },
  { key: 'maxDiasAtrasoInicial', label: 'Días de atraso cuota inicial', ancho: 14 },
];

function hojaTabla(wb, nombre, columnas, filas, { totales = [] } = {}) {
  const ws = wb.addWorksheet(nombre);
  columnas.forEach((c, i) => { ws.getColumn(i + 1).width = c.ancho ?? 22; });
  const enc = ws.getRow(1);
  columnas.forEach((c, i) => {
    const cell = enc.getCell(i + 1);
    cell.value = c.label;
    cell.fill = fillSolida(ENCABEZADO_BG);
    cell.font = { bold: true, color: { argb: ENCABEZADO_INK }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  enc.height = 34;
  filas.forEach((f, r) => {
    const row = ws.getRow(r + 2);
    columnas.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = f[c.key];
      cell.value = v === undefined || v === '' ? null : v;
      if (c.dinero) cell.numFmt = FORMATO_PESOS;
    });
  });
  if (totales.length > 0 && filas.length > 0) {
    // Una fila en blanco antes del total: así el filtro y el orden de Excel no lo mezclan con los datos.
    const row = ws.getRow(filas.length + 3);
    row.getCell(1).value = 'TOTAL (de lo filtrado)';
    columnas.forEach((c, i) => {
      if (!totales.includes(c.key)) return;
      const letra = ws.getColumn(i + 1).letter;
      const cell = row.getCell(i + 1);
      cell.value = { formula: `SUBTOTAL(109,${letra}2:${letra}${filas.length + 1})` };
      cell.numFmt = FORMATO_PESOS;
    });
    row.eachCell({ includeEmpty: true }, (cell) => { cell.font = { bold: true }; cell.fill = fillSolida(TOTAL_BG); });
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };
  ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 1 }];
  return ws;
}

export function agregarHojasDesglose(wb, unidades, etiquetaEtapa) {
  const filas = unidades.map((u) => ({ ...u, etapa: etiquetaEtapa(u.etapa), torre: u.torre == null ? null : String(u.torre) }));
  const montos = COLUMNAS_TODAS.filter((c) => c.dinero).map((c) => c.key);

  hojaTabla(wb, 'Todas las unidades', COLUMNAS_TODAS, filas, { totales: montos });

  const disponibles = filas.filter((u) => u.estado === 'Disponible');
  hojaTabla(wb, 'Unidades disponibles', COLUMNAS_TODAS.filter((c) => ['etapa', 'frente', 'torre', 'unidad', 'valorUnidadDisponible'].includes(c.key)), disponibles, { totales: ['valorUnidadDisponible'] });

  const columnasVendidas = COLUMNAS_TODAS.filter((c) => c.key !== 'valorUnidadDisponible' && c.key !== 'estado');
  const vendidas = filas.filter((u) => u.estado === 'Vendida');
  hojaTabla(wb, 'Cuotas iniciales', columnasVendidas.filter((c) => !['pendienteTotal', 'saldoAFavor', 'pendienteCredito', 'recaudadoCredito'].includes(c.key)), vendidas.filter((u) => (u.cuotaInicial ?? 0) > 0), { totales: ['cuotaInicial', 'recaudado', 'recaudadoCuotaInicial', 'pendienteCuotaInicial', 'montoEnMoraInicial'] });

  const pendientes = vendidas.filter((u) => (u.pendienteTotal ?? 0) > 0).sort((a, b) => b.pendienteTotal - a.pendienteTotal);
  hojaTabla(wb, 'Pendiente por recaudar', columnasVendidas.filter((c) => !['saldoAFavor', 'recaudadoCredito'].includes(c.key)), pendientes, { totales: ['valorVenta', 'cuotaInicial', 'recaudado', 'pendienteTotal', 'pendienteCuotaInicial', 'pendienteCredito', 'montoEnMoraInicial'] });

  // Por etapa: lo que falta de los que deben menos lo que pagaron de más = el pendiente del Consolidado (si no queda en 0).
  const porEtapa = [];
  for (const u of filas.filter((x) => x.estado === 'Vendida')) {
    let e = porEtapa.find((x) => x.etapa === u.etapa);
    if (!e) { e = { etapa: u.etapa, deben: 0, pendiente: 0, favor: 0, saldoFavor: 0, neto: 0 }; porEtapa.push(e); }
    if ((u.pendienteTotal ?? 0) > 0) { e.deben += 1; e.pendiente += u.pendienteTotal; }
    if ((u.saldoAFavor ?? 0) > 0) { e.favor += 1; e.saldoFavor += u.saldoAFavor; }
  }
  porEtapa.forEach((e) => { e.neto = Math.max(0, e.pendiente - e.saldoFavor); });
  hojaTabla(wb, 'Conciliación pendiente', [
    { key: 'etapa', label: 'Etapa', ancho: 18 },
    { key: 'deben', label: 'Negocios que deben', ancho: 14 },
    { key: 'pendiente', label: 'Suma de lo que deben', dinero: true },
    { key: 'favor', label: 'Negocios con saldo a favor', ancho: 14 },
    { key: 'saldoFavor', label: 'Suma de saldos a favor', dinero: true },
    { key: 'neto', label: 'Pendiente del Consolidado (deben − saldos a favor)', dinero: true, ancho: 30 },
  ], porEtapa, { totales: ['deben', 'pendiente', 'favor', 'saldoFavor', 'neto'] });
}
