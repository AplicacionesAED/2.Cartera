// Selector de mes en cuadrícula: el año arriba (con flechas) y los 12 meses debajo. Crece por años, no por meses, así que
// sirve aunque el histórico sea largo. Valores como 'AAAA-MM'.
//   - Un mes:  value = 'AAAA-MM',          onChange('AAAA-MM')
//   - Rango:   rango, value = { desde, hasta } ('' si no hay), onChange({ desde, hasta }) cuando se completa: el primer
//              clic marca el inicio y el segundo el final (si es anterior al inicio, se ordenan solos).
// `disponibles` (opcional): Set de 'AAAA-MM' que se pueden elegir; `minMes` / `maxMes` (opcionales) acotan el rango
// elegible. Los meses no elegibles salen deshabilitados y las flechas solo llevan a años que tengan algún mes elegible.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './SelectorMes.module.css';

const ABREVIADOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// 'AAAA-MM' -> 'Octubre 2026' / 'Oct 2026'
export const etiquetaMesLarga = (mes) => (mes ? `${NOMBRES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}` : '');
export const etiquetaMesCorta = (mes) => (mes ? `${ABREVIADOS[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}` : '');

export function SelectorMes({ value, onChange, disponibles, minMes, maxMes, rango = false }) {
  const valorUnico = rango ? (value?.desde || '') : (value || '');
  const anioDeValor = valorUnico ? Number(valorUnico.slice(0, 4)) : new Date().getFullYear();
  const [anio, setAnio] = useState(anioDeValor);
  useEffect(() => { setAnio(anioDeValor); }, [anioDeValor]);
  const [inicio, setInicio] = useState(null); // rango: primer clic, a la espera del segundo

  const elegible = (clave) => (!disponibles || disponibles.has(clave)) && (!minMes || clave >= minMes) && (!maxMes || clave <= maxMes);
  const anios = disponibles
    ? [...disponibles].filter(elegible).map((m) => Number(m.slice(0, 4)))
    : [minMes, maxMes].filter(Boolean).map((m) => Number(m.slice(0, 4)));
  const anioMin = disponibles || minMes ? (anios.length ? Math.min(...anios) : null) : null;
  const anioMax = disponibles || maxMes ? (anios.length ? Math.max(...anios) : null) : null;

  const desde = rango ? (inicio ?? value?.desde ?? '') : '';
  const hasta = rango ? (inicio ? '' : (value?.hasta ?? '')) : '';

  function elegir(clave) {
    if (!rango) { onChange(clave); return; }
    if (!inicio) { setInicio(clave); return; }
    onChange(clave < inicio ? { desde: clave, hasta: inicio } : { desde: inicio, hasta: clave });
    setInicio(null);
  }

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
          const activo = rango ? (clave === desde || clave === hasta) : clave === value;
          const enRango = rango && desde && hasta && clave > desde && clave < hasta;
          return (
            <button
              key={clave}
              type="button"
              className={`${styles.mes} ${activo ? styles.mesActivo : ''} ${enRango ? styles.mesEnRango : ''}`}
              onClick={() => elegir(clave)}
              disabled={!elegible(clave)}
              aria-pressed={activo}
            >
              {nombre}
            </button>
          );
        })}
      </div>
      {rango && <p className={styles.ayuda}>{inicio ? `Desde ${etiquetaMesCorta(inicio)}: elige el mes final.` : 'Elige el mes inicial y luego el final.'}</p>}
    </div>
  );
}
