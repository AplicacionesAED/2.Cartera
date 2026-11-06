// ESTADO FIDUCIA: el estado del negocio vinculado en la fiducia, VIP (respeta el del CRM) o LIBRE, cada uno con su
// color (utils/estadosFiducia.js). Un LIBRE sin negocio vinculado lleva una alerta pequeña (`libreSinVinculo`): puede
// ser un inmueble realmente libre o uno que no se logró vincular con la fiducia.
import { TriangleAlert } from 'lucide-react';
import { tonoEstadoFiducia, estadoVisible } from '../../utils/estadosFiducia.js';

// `real`: muestra el estado real (el detalle); sin él, los listados agrupan PROMETIDO, OPCIONADO, ESCRITURA_AUTORIZADA y VENDIDO como VENDIDO.
export function EstadoFiduciaBadge({ estado, libreSinVinculo, real = false }) {
  if (!estado) return null;
  const mostrado = real ? estado : estadoVisible(estado);
  const tono = tonoEstadoFiducia(mostrado);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 3,
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-label-size)',
          fontWeight: 'var(--text-label-weight)',
          letterSpacing: 'var(--text-label-tracking)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          background: tono.bg,
          color: tono.ink,
        }}
      >
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: tono.ink }} />
        {String(mostrado).replace(/_/g, ' ')}
      </span>
      {libreSinVinculo && (
        <span
          title="Sin negocio vinculado en la fiducia: se marca como LIBRE."
          aria-label="Sin negocio vinculado en la fiducia"
          style={{ display: 'inline-flex', color: 'var(--color-warning, #b45309)' }}
        >
          <TriangleAlert size={14} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
