// Tabla del Informe de ventas de Oliv en el Resumen, con el mismo estilo que la lista de Negocios (avatar, insignias, dos líneas por
// celda, cifras a la derecha). Agrupa las 20 columnas del informe en 15 (Unidad+Torre, Comprador+Identificación, Contacto,
// Residencia); el Excel sigue trayendo las 20. Cartera en Gestión usa TablaCarteraOliv, sin cambios.
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ariaSort } from '../../hooks/useSortableTable.js';
import { formatCOP, formatDate } from '../../utils/format.js';
import { INFO_COLUMNAS_CARTERA_OLIV as INFO } from './infoColumnasCarteraOliv.js';
import styles from '../negocios/NegociosPage.module.css';

export const COLUMNAS_INFORME_VENTAS_OLIV = 15;

const fmtPct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
const cop = (v) => (v != null ? formatCOP(v) : '—');
const dash = <span className={styles.muted}>—</span>;

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase() || '?';
}

// [etiqueta, llave de orden, alineación, texto del tooltip]
const COLUMNAS = [
  ['Fecha de venta', 'fechaContrato', 'left', INFO.fechaContrato],
  ['Unidad', 'unidad', 'left', `Nomenclatura: ${INFO.unidad} Debajo, la torre: ${INFO.torre}`],
  ['Etapa', 'estado', 'left', INFO.estado],
  ['Comprador', 'comprador', 'left', `${INFO.comprador} Debajo, tipo y número de identificación: ${INFO.identificacion}`],
  ['Contacto', 'telefono', 'left', `Teléfono: ${INFO.telefono} Debajo, correo: ${INFO.email}`],
  ['Residencia', 'paisResidencia', 'left', `País: ${INFO.paisResidencia} Debajo, departamento: ${INFO.departamentoResidencia}`],
  ['Área (m²)', 'area', 'right', INFO.area],
  ['Valor del negocio', 'valorInmueble', 'right', INFO.valorInmueble],
  ['Valor del inmueble', 'valorApartamento', 'right', INFO.valorApartamento],
  ['Parqueadero', 'valorParqueadero', 'right', INFO.valorParqueadero],
  ['Abonado', 'totalAbonado', 'right', INFO.totalAbonado],
  ['% recibido', 'pctRecaudo', 'right', INFO.pctRecaudo],
  ['Por recibir', 'porRecibir', 'right', INFO.porRecibir],
  ['Contado', 'valorCuotaInicial', 'right', INFO.valorCuotaInicial],
  ['Crédito', 'credito', 'right', INFO.credito],
];

export function EncabezadoInformeVentasOliv({ sort, onSort }) {
  return (
    <tr>
      {COLUMNAS.map(([label, key, align, info]) => (
        <th key={key} aria-sort={ariaSort(sort, key)} className={align === 'right' ? styles.derecha : undefined}>
          <SortHeader label={label} sortKey={key} info={info} sort={sort} onSort={onSort} align={align} />
        </th>
      ))}
    </tr>
  );
}

export function FilaInformeVentasOliv({ f, onClick }) {
  const identificacion = [f.tipoIdentificacion, f.identificacion].filter(Boolean).join(' ');
  const residencia = [f.paisResidencia, f.departamentoResidencia].filter(Boolean);
  const num = `${styles.derecha} ${styles.nowrap}`;
  return (
    <tr className={styles.filaClicable} onClick={onClick}>
      <td className={styles.nowrap}>{f.fechaContrato ? formatDate(f.fechaContrato) : dash}</td>
      <td>
        <div className={styles.celdaTitulo}>
          <span className={styles.nombre}>{f.unidad ?? f.id}</span>
          {f.torre && <span className={styles.detalleSec}>Torre {f.torre}</span>}
        </div>
      </td>
      <td>{f.estado ? <Badge variant="neutral">{f.estado}</Badge> : dash}</td>
      <td>
        {f.comprador ? (
          <div className={styles.persona}>
            <span className={styles.avatar}>{iniciales(f.comprador)}</span>
            <div className={styles.celdaTitulo}>
              <span className={styles.nombre}>{f.comprador}</span>
              {identificacion && <span className={styles.detalleSec}>{identificacion}</span>}
            </div>
          </div>
        ) : dash}
      </td>
      <td>
        {f.telefono || f.email ? (
          <div className={styles.celdaTitulo}>
            <span className={styles.nowrap}>{f.telefono ?? '—'}</span>
            <span className={styles.detalleSec}>{f.email ?? '—'}</span>
          </div>
        ) : dash}
      </td>
      <td>
        {residencia.length ? (
          <div className={styles.celdaTitulo}>
            <span className={styles.nowrap}>{residencia[0]}</span>
            {residencia[1] && <span className={styles.detalleSec}>{residencia[1]}</span>}
          </div>
        ) : dash}
      </td>
      <td className={num}>{f.area != null ? f.area.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
      <td className={`${num} ${styles.saldo}`}>{cop(f.valorInmueble)}</td>
      <td className={num}>{cop(f.valorApartamento)}</td>
      <td className={num}>{cop(f.valorParqueadero)}</td>
      <td className={`${num} ${styles.saldo} ${f.totalAbonado > 0 ? styles.saldoPositivo : ''}`}>{formatCOP(f.totalAbonado ?? 0)}</td>
      <td className={num}>{fmtPct(f.pctRecaudo)}</td>
      <td className={num}>{cop(f.porRecibir)}</td>
      <td className={num}>{cop(f.valorCuotaInicial)}</td>
      <td className={num}>{cop(f.credito)}</td>
    </tr>
  );
}
