// Selector de año con flechas (‹ 2026 ›) para barras de filtros: `anios` = años elegibles (de menor a mayor), `value` =
// año elegido, `activo` = si ese año es el filtro que está aplicado (entonces se resalta). Un clic en el año lo aplica; las
// flechas pasan al año anterior o siguiente y lo aplican.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './SelectorAnio.module.css';

export function SelectorAnio({ anios, value, activo, onSeleccionar }) {
  if (!anios?.length) return null;
  const orden = [...anios].sort((a, b) => a - b);
  const actual = orden.includes(value) ? value : orden[orden.length - 1];
  const i = orden.indexOf(actual);

  return (
    <div className={`${styles.grupo} ${activo ? styles.grupoActivo : ''}`}>
      <button type="button" className={styles.flecha} onClick={() => onSeleccionar(orden[i - 1])} disabled={i <= 0} aria-label="Año anterior">
        <ChevronLeft size={14} aria-hidden="true" />
      </button>
      <button type="button" className={styles.anio} onClick={() => onSeleccionar(actual)} aria-pressed={Boolean(activo)}>
        {activo ? actual : `Año ${actual}`}
      </button>
      <button type="button" className={styles.flecha} onClick={() => onSeleccionar(orden[i + 1])} disabled={i >= orden.length - 1} aria-label="Año siguiente">
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
