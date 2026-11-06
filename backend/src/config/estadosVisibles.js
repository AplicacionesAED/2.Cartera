// En los listados de Negocios e Inmuebles de Baía Kristal, los estados de fiducia PROMETIDO, OPCIONADO, ESCRITURA_AUTORIZADA y
// VENDIDO se muestran todos como VENDIDO; el estado real solo se ve en el detalle. Esto hace lo mismo con los filtros:
// elegir VENDIDO trae los cuatro estados, y las opciones del filtro ya no ofrecen los otros tres por separado.
const ESTADOS_COMO_VENDIDO = ['PROMETIDO', 'OPCIONADO', 'ESCRITURA_AUTORIZADA', 'VENDIDO'];

const clave = (estado) => String(estado ?? '').trim().toUpperCase().replace(/\s+/g, '_');

const estadoVisible = (estado) => (ESTADOS_COMO_VENDIDO.includes(clave(estado)) ? 'VENDIDO' : estado);

// Estados reales que hay que buscar para los valores elegidos en el filtro.
function expandirEstadosFiltro(estados) {
  return [...new Set(estados.flatMap((e) => (clave(e) === 'VENDIDO' ? ESTADOS_COMO_VENDIDO : [e])))];
}

// Opciones del filtro: los estados reales agrupados como se ven.
const opcionesEstadoVisibles = (estados) => [...new Set(estados.map(estadoVisible))];

module.exports = { ESTADOS_COMO_VENDIDO, estadoVisible, expandirEstadosFiltro, opcionesEstadoVisibles };
