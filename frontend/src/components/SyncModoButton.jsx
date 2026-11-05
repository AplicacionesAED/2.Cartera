// Botón con selector de modo (botón dividido): el botón principal ejecuta el modo elegido y la flecha abre la lista
// para cambiarlo. Ej.: "Sincronizar cambios" (por defecto) / "Sincronizar todo", o "Exportar Excel" / "Exportar PDF".
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Download, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import styles from './SyncModoButton.module.css';

// Modos de las sincronizaciones de Oliv (HubSpot).
export const MODOS_SYNC_OLIV = [
  { value: 'cambios', label: 'Sincronizar cambios', descripcion: 'Trae solo lo que cambió en HubSpot desde la última sincronización (rápido).' },
  { value: 'todo', label: 'Sincronizar todo', descripcion: 'Vuelve a traer todo lo que cumple la regla y quita lo que ya no la cumple (tarda más).' },
];

// Formatos en que se exporta el Consolidado del Resumen (Baía Kristal y Oliv).
export const FORMATOS_EXPORTAR_CONSOLIDADO = [
  { value: 'xlsx', label: 'Exportar Excel', descripcion: 'Hoja de cálculo (.xlsx) con las mismas columnas y valores que ves en pantalla.' },
  { value: 'pdf', label: 'Exportar PDF', descripcion: 'Documento horizontal (A4) listo para compartir o imprimir.' },
];

// opciones: [{ value, label, descripcion }]; `Icono` y `ariaLabelFlecha` permiten usarlo para algo distinto a sincronizar.
export function SyncModoButton({ opciones, modo, onModo, onEjecutar, disabled = false, Icono = RefreshCw, ariaLabelFlecha = 'Elegir tipo de sincronización' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const actual = opciones.find((o) => o.value === modo) ?? opciones[0];

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrar(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className={styles.grupo} ref={ref}>
      <Button variant="secondary" onClick={() => onEjecutar(actual.value)} disabled={disabled}>
        <span className={styles.interior}>
          <Icono size={14} aria-hidden="true" />
          {actual.label}
        </span>
      </Button>
      <button
        type="button"
        className={styles.flecha}
        onClick={() => setAbierto((a) => !a)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={ariaLabelFlecha}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {abierto && (
        <div className={styles.menu} role="menu">
          {opciones.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === actual.value}
              className={styles.opcion}
              onClick={() => {
                onModo(o.value);
                setAbierto(false);
              }}
            >
              <span className={styles.opcionTitulo}>
                {o.label}
                {o.value === actual.value && <Check size={14} aria-hidden="true" />}
              </span>
              {o.descripcion && <span className={styles.opcionDesc}>{o.descripcion}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
