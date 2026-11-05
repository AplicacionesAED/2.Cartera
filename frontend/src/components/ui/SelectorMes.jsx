// Selector de mes en cuadrícula: el año arriba (con flechas) y los 12 meses debajo. Crece por años, no por meses, así que
// sirve aunque el histórico sea largo. `disponibles` (opcional): Set de 'AAAA-MM' que se pueden elegir; los demás meses
// salen deshabilitados, y las flechas solo llevan a años que tienen algún mes disponible.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './SelectorMes.module.css';

const ABREVIADOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function SelectorMes({ value, onChange, disponibles }) {
  const anioDeValor = value ? Number(value.slice(0, 4)) : new Date().getFullYear();
  const [anio, setAnio] = useState(anioDeValor);
  useEffect(() => { setAnio(anioDeValor); }, [anioDeValor]);

  const anios = disponibles ? [...disponibles].map((m) => Number(m.slice(0, 4))) : null;
  const anioMin = anios?.length ? Math.min(...anios) : null;
  const anioMax = anios?.length ? Math.max(...anios) : null;

  return (
    <div className={styles.selector}>
      <div className={styles.anio}>
        <button type="button" className={styles.flecha} onClick={() => setAnio((a) => a - 1)} disabled={anioMin != null && anio <= anioMin} aria-label="Año anterior">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className={styles.anioTexto} aria-live="polite">{anio}</span>
        <button type="button" className={styles.flecha} onClick={() => setAnio((a) => a + 1)} disabled={anioMax != null && anio >= anioMax} aria-label="Año siguiente">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.meses} role="group" aria-label={`Meses de ${anio}`}>
        {ABREVIADOS.map((nombre, i) => {
          const clave = `${anio}-${String(i + 1).padStart(2, '0')}`;
          const habilitado = !disponibles || disponibles.has(clave);
          return (
            <button
              key={clave}
              type="button"
              className={`${styles.mes} ${clave === value ? styles.mesActivo : ''}`}
              onClick={() => onChange(clave)}
              disabled={!habilitado}
              aria-pressed={clave === value}
            >
              {nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
