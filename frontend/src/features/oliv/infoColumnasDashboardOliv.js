// De dónde sale cada columna de la tabla del Dashboard (Plan vs Recaudo) de Oliv (tooltip del encabezado). Las llaves son
// los `id` de COLUMNAS_FIJAS; el cálculo está en backend/src/modules/oliv/olivResumen/olivResumen.service.js.
export const INFO_COLUMNAS_DASHBOARD_OLIV = {
  torre: 'HubSpot, objeto Unidades: torre del inmueble.',
  unidad: 'HubSpot, objeto Unidades: código de la unidad (ya incluye la torre).',
  valorInmueble: 'Calculado: suma del plan de pagos de la cotización aceptada (Centro de Aplicaciones Comerciales), con parqueadero y ya con descuentos y bono. Sin cotización, el valor comercial del inmueble en HubSpot.',
  valorCuotaInicial: 'Calculado: suma de las cuotas del plan de pagos de la cotización aceptada, sin la última (el saldo final).',
  abonadoCuotaInicial: 'Calculado: pagos del Excel de Encargos de la fiducia aplicados, en orden, a las cuotas de la cuota inicial del plan.',
  fechaSaldoContraentrega: 'Calculado: fecha de la última cuota del plan de pagos de la cotización aceptada.',
  valorSaldoContraentrega: 'Calculado: valor de la última cuota del plan de pagos de la cotización aceptada.',
  totalAbonado: 'Calculado: pagos del Excel de Encargos de la fiducia aplicados contra el plan de pagos de la cotización aceptada.',
  pendienteRecaudar: 'Calculado: Valor del inmueble − Total abonado (nunca menor a cero).',
  cuotasEnMora: 'Calculado: cuotas del plan de pagos (cuota inicial y saldo final) con fecha anterior a hoy que no están pagadas completas.',
  montoEnMora: 'Calculado: lo que falta por pagar de esas cuotas vencidas.',
};

export const INFO_MES_DASHBOARD_OLIV = {
  proyectado: 'Plan de pagos de la cotización aceptada: lo que debía pagarse en ese mes, según la fecha de cada cuota.',
  recaudado: 'Pagos del Excel de Encargos de la fiducia con fecha contable en ese mes.',
  porRecaudar: 'Plan de pagos de la cotización aceptada: lo que falta por pagar de las cuotas de ese mes.',
};
