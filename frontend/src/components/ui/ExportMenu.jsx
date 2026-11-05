// Botón "Exportar" con menú de formatos (Excel / CSV / PDF), compartido por los listados de Negocios de Baía Kristal
// y de Oliv para que se vean y se comporten igual.
import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './Button.jsx';
import styles from '../../features/negocios/NegociosPage.module.css';

const FORMATOS = [
  ['Excel (.xlsx)', 'xlsx'],
  ['CSV', 'csv'],
  ['PDF', 'pdf'],
];

// `formatos` (opcional): cuáles de esos formatos ofrece, ej. ['xlsx', 'pdf']; por defecto todos.
export function ExportMenu({ onExport, disabled, formatos }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className={styles.exportWrap} ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <span className={styles.botonInterior}>
          <Download size={14} aria-hidden="true" />
          Exportar
        </span>
      </Button>
      {open && (
        <div className={styles.exportMenu} role="menu">
          {FORMATOS.filter(([, fmt]) => !formatos || formatos.includes(fmt)).map(([label, fmt]) => (
            <button
              key={fmt}
              type="button"
              role="menuitem"
              className={styles.exportOption}
              onClick={() => {
                setOpen(false);
                onExport(fmt);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
