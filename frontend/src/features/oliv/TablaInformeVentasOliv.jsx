// Tabla del Informe de ventas de Oliv en el Resumen: las 20 columnas del informe con el estilo de la lista de Negocios (avatar,
// insignia de etapa, cifras a la derecha). Cartera en Gestión usa TablaCarteraOliv, sin cambios.
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ariaSort } from '../../hooks/useSortableTable.js';
import { formatCOP, formatDate } from '../../utils/format.js';
import { INFO_COLUMNAS_CARTERA_OLIV as INFO } from './infoColumnasCarteraOliv.js';
import styles from '../negocios/NegociosPage.module.css';

export const COLUMNAS_INFORME_VENTAS_OLIV = 20;

const fmtPct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
const cop = (v) => (v != null ? formatCOP(v) : '—');
const dash = <span className={styles.muted}>—</span>;
const texto = (v) => (v ? <span className={styles.nowrap}>{v}</span> : dash);

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase() || '?';
}

// [etiqueta, llave de orden, alineación]
const COLUMNAS = [
  ['Fecha de venta', 'fechaContrato', 'left'], ['Etapa', 'estado', 'left'], ['Torre', 'torre', 'left'], ['Nomenclatura', 'unidad', 'left'],
  ['Área (m²)', 'area', 'right'], ['Comprador', 'comprador', 'left'], ['Tipo de identificación', 'tipoIdentificacion', 'left'], ['Identificación', 'identificacion', 'left'],
  ['País de residencia', 'paisResidencia', 'left'], ['Departamento de residencia', 'departamentoResidencia', 'left'], ['Teléfono', 'telefono', 'left'], ['Correo electrónico', 'email', 'left'],
  ['Valor total del negocio', 'valorInmueble', 'right'], ['Valor total del inmueble', 'valorApartamento', 'right'], ['Valor del parqueadero', 'valorParqueadero', 'right'],
  ['Abonado total', 'totalAbonado', 'right'], ['% recibido total', 'pctRecaudo', 'right'], ['Por recibir', 'porRecibir', 'right'],
  ['Valor de contado', 'valorCuotaInicial', 'right'], ['Valor crédito', 'credito', 'right'],
];

export function EncabezadoInformeVentasOliv({ sort, onSort }) {
  return (
    <tr>
      {COLUMNAS.map(([label, key, align]) => (
        <th key={key} aria-sort={ariaSort(sort, key)} className={align === 'right' ? styles.derecha : undefined}>
          <SortHeader label={label} sortKey={key} info={INFO[key]} sort={sort} onSort={onSort} align={align} />
        </th>
      ))}
    </tr>
  );
}

export function FilaInformeVentasOliv({ f, onClick }) {
  const num = `${styles.derecha} ${styles.nowrap}`;
  return (
    <tr className={styles.filaClicable} onClick={onClick}>
      <td className={styles.nowrap}>{f.fechaContrato ? formatDate(f.fechaContrato) : dash}</td>
      <td>{f.estado ? <Badge variant="neutral">{f.estado}</Badge> : dash}</td>
      <td>{texto(f.torre)}</td>
      <td><span className={styles.nombre}>{f.unidad ?? f.id}</span></td>
      <td className={num}>{f.area != null ? f.area.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
      <td>
        {f.comprador ? (
          <div className={styles.persona}>
            <span className={styles.avatar}>{iniciales(f.comprador)}</span>
            <span className={styles.nowrap}>{f.comprador}</span>
          </div>
        ) : dash}
      </td>
      <td>{texto(f.tipoIdentificacion)}</td>
      <td>{texto(f.identificacion)}</td>
      <td>{texto(f.paisResidencia)}</td>
      <td>{texto(f.departamentoResidencia)}</td>
      <td>{texto(f.telefono)}</td>
      <td>{texto(f.email)}</td>
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
