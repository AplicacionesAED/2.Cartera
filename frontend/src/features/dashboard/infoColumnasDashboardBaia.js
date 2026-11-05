// De dónde sale cada columna de la tabla del Dashboard (Plan vs Recaudo) de Baía Kristal (tooltip del encabezado). Las
// llaves son los `id` de COLUMNAS_FIJAS; los valores de dinero son los mismos del Resumen (Consolidado y KPIs): todo sale
// de la fiducia. El cálculo está en baiaDashboard.service.js#filaDashboardDesdeFiducia.
export const INFO_COLUMNAS_DASHBOARD_BAIA = {
  etapa: 'Calculado: columna proyecto + torre del Inventario de Zoho, traducida con la tabla fija de etapas.',
  frente: 'Inventario de Zoho: proyecto o frente del inmueble.',
  torre: 'Inventario de Zoho: torre del inmueble.',
  unidad: 'Inventario de Zoho: nomenclatura del inmueble.',
  valorInmueble: 'Excel de la fiducia: columna "Valor venta" del negocio (en Etapas 1 y 2 vendidas, el "Valor factura"). Es el mismo valor de "Valor ventas fiduciaria" del Resumen. Los inmuebles libres no tienen.',
  valorCuotaInicial: 'Excel de la fiducia: columna "Cuota inicial" del negocio. Es el mismo valor de "Valor cuotas iniciales" del Resumen.',
  abonadoCuotaInicial: 'Calculado: lo pagado según los movimientos de la fiducia, hasta el valor de la cuota inicial. Es el mismo valor de "Recaudado cuota inicial" del Resumen.',
  fechaSaldoContraentrega: 'Calculado: fecha esperada de la última cuota del plan de pagos de Zoho, o la de Configuración → Fechas de entrega si existe.',
  valorSaldoContraentrega: 'Calculado: Valor venta − Cuota inicial de la fiducia (nunca menor a cero).',
  totalAbonado: 'Calculado: suma de los movimientos de la fiducia del negocio (hoja "Mov_Por_Propietario"), sin el asiento de venta y desde el último desistimiento. Es el mismo valor de "Recaudado" del Resumen.',
  pendienteRecaudar: 'Calculado: Valor del inmueble − Total abonado (nunca menor a cero).',
  cuotasEnMora: 'Calculado: cuotas del plan de pagos de Zoho (cuota inicial y saldo contraentrega) con fecha anterior a hoy que no están pagadas completas.',
  montoEnMora: 'Calculado: lo que falta por pagar de esas cuotas vencidas.',
};

export const INFO_MES_DASHBOARD_BAIA = {
  proyectado: 'Plan de pagos de Zoho: lo que debía pagarse en ese mes, según la fecha de cada cuota.',
  recaudado: 'Pagos de la fiducia con fecha contable en ese mes (los pagos sin fecha no aparecen). Lo pagado cubre primero la cuota inicial y lo que sobra es crédito.',
  porRecaudar: 'Plan de pagos de Zoho: lo que falta por pagar de las cuotas de ese mes.',
};
