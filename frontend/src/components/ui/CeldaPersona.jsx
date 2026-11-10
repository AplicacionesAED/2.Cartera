// Nombre de una persona con avatar de iniciales, como en la lista de Negocios. Para tablas de Cartera e Informe de ventas.
import styles from '../../features/negocios/NegociosPage.module.css';

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase() || '?';
}

export function CeldaPersona({ nombre }) {
  if (!nombre) return <span className={styles.muted}>—</span>;
  return (
    <div className={styles.persona} title={nombre}>
      <span className={styles.avatar}>{iniciales(nombre)}</span>
      <span className={styles.nowrap}>{nombre}</span>
    </div>
  );
}
