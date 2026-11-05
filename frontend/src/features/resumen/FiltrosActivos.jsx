// Fila bajo la barra de filtros del Resumen: a qué secciones aplican los filtros y, cuando hay selección, cada valor elegido
// como etiqueta que se puede quitar con un clic. `chips`: [{ clave, texto, onQuitar }].
import { X } from 'lucide-react';
import styles from './FiltrosActivos.module.css';

export function FiltrosActivos({ alcance, chips = [] }) {
  return (
    <div className={styles.fila}>
      {chips.map((c) => (
        <button key={c.clave} type="button" className={styles.chip} onClick={c.onQuitar} aria-label={`Quitar ${c.texto}`}>
          {c.texto}
          <X size={12} aria-hidden="true" />
        </button>
      ))}
      <span className={styles.alcance}>{alcance}</span>
    </div>
  );
}
