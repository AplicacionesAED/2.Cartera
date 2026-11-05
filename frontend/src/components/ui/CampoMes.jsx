// Campo compacto que despliega el SelectorMes (cuadrícula de meses) al hacer clic: para filtros en una barra, donde la
// cuadrícula completa no cabe. Un mes (`value` = 'AAAA-MM') o un rango (`rango`, `value` = { desde, hasta }).
// `etiqueta(value)` (opcional) arma el texto del botón; `onLimpiar` (opcional) agrega "Quitar selección".
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { SelectorMes, etiquetaMesLarga, etiquetaMesCorta } from './SelectorMes.jsx';
import styles from './CampoMes.module.css';

function etiquetaPorDefecto(value, rango) {
  if (!rango) return etiquetaMesLarga(value);
  if (!value?.desde) return '';
  if (!value.hasta || value.hasta === value.desde) return etiquetaMesCorta(value.desde);
  return `${etiquetaMesCorta(value.desde)} – ${etiquetaMesCorta(value.hasta)}`;
}

export function CampoMes({ id, value, onChange, rango = false, disponibles, minMes, maxMes, etiqueta, placeholder = 'Elegir mes', onLimpiar, disabled = false }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarFuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const cerrarEscape = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', cerrarFuera);
    document.addEventListener('keydown', cerrarEscape);
    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      document.removeEventListener('keydown', cerrarEscape);
    };
  }, [abierto]);

  const texto = (etiqueta ?? ((v) => etiquetaPorDefecto(v, rango)))(value);
  const hayValor = rango ? Boolean(value?.desde) : Boolean(value);

  return (
    <div className={styles.campo} ref={ref}>
      <button id={id} type="button" className={styles.boton} onClick={() => setAbierto((a) => !a)} disabled={disabled} aria-haspopup="dialog" aria-expanded={abierto}>
        <CalendarDays size={15} aria-hidden="true" />
        <span className={hayValor ? styles.texto : styles.placeholder}>{texto || placeholder}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {abierto && (
        <div className={styles.popover} role="dialog" aria-label="Elegir mes">
          <SelectorMes
            value={value}
            rango={rango}
            disponibles={disponibles}
            minMes={minMes}
            maxMes={maxMes}
            onChange={(v) => { onChange(v); setAbierto(false); }}
          />
          {onLimpiar && hayValor && (
            <button type="button" className={styles.limpiar} onClick={() => { onLimpiar(); setAbierto(false); }}>Quitar selección</button>
          )}
        </div>
      )}
    </div>
  );
}
