// De dónde sale cada columna de la tabla de Cartera en Gestión de Baía Kristal (tooltip del encabezado). Las llaves son
// las `sortKey` de la tabla (más `frenteTorre`, que no se ordena); el detalle completo está en
// Documentacion-Calculos-Dashboard-Resumen-Cartera-Baia-Kristal.md y el cálculo en baiaDashboard.service.js.
export const INFO_COLUMNAS_CARTERA_BAIA = {
  etapa: 'Calculado: columna proyecto + torre del Inventario de Zoho, traducida con la tabla fija de etapas.',
  frenteTorre: 'Calculado: columna proyecto + torre del Inventario de Zoho, traducida con la tabla fija de etapas.',
  unidad: 'Inventario de Zoho: nomenclatura del inmueble.',
  referencia: 'Excel de la fiducia, hoja "Movimientos": columna "Referencia".',
  comprador: 'Excel de la fiducia, hoja "Mov_Por_Propietario": columna "Propietario".',
  fechaContrato: 'Excel de la fiducia, hoja "Movimientos": columna "Fecha Contrato" del negocio (fecha de vinculación). Vacía si la fiducia no la trae.',
  area: 'Excel de la fiducia: columna "Área" del negocio. Si no trae un valor posible, el área construida del Inventario de Zoho.',
  valorInmueble: 'Calculado: suma de las cuotas del plan de pagos de Zoho, ajustada a la columna "Valor Venta" de la hoja "Movimientos" de la fiducia.',
  valorM2: 'Calculado: Valor apartamento ÷ Área (m²).',
  totalAbonado: 'Calculado: pagos de la hoja "Mov_Por_Propietario" de la fiducia aplicados al plan de pagos de Zoho (conciliación).',
  cuotasEnMora: 'Calculado: cuántas cuotas de la cuota inicial (todas menos la última) tienen fecha vencida y no están pagadas del todo.',
  maxDiasAtraso: 'Calculado: el mayor atraso en días entre esas cuotas.',
  montoEnMora: 'Calculado: lo que les falta por pagar a esas cuotas. En Saldo Contraentrega: lo que falta de la última cuota del plan.',
  pctEnMora: 'Calculado: Valor vencido ÷ suma de las cuotas de la cuota inicial cuya fecha ya pasó.',
  fechaSaldoContraentrega: 'Calculado: fecha esperada de la última cuota del plan de Zoho (saldo contraentrega), o la de Configuración → Fechas de entrega si existe.',
};
