// Encabezado y fila de la tabla de Cartera en Gestión de Oliv, vista "Cuota Inicial" (20 columnas del informe). La usan la
// pantalla Cartera en Gestión y el Resumen, así las dos tablas son siempre idénticas. Cada pantalla arma su <table>, su
// <tbody> y el manejo de clics.
import { Link } from 'react-router-dom';
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { ariaSort } from '../../hooks/useSortableTable.js';
import { formatCOP, formatDate } from '../../utils/format.js';
import { INFO_COLUMNAS_CARTERA_OLIV } from './infoColumnasCarteraOliv.js';
import styles from '../cartera-mora/CarteraMoraPage.module.css';

export const COLUMNAS_CARTERA_OLIV_INICIAL = 20;

const fmtPct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);

// [etiqueta, llave de orden, centrada]
const COLUMNAS = [
  ['Fecha de venta', 'fechaContrato', true], ['Etapa', 'estado'], ['Torre', 'torre'], ['Nomenclatura', 'unidad'],
  ['Área (m²)', 'area', true], ['Comprador', 'comprador'], ['Tipo de identificación', 'tipoIdentificacion'], ['Identificación', 'identificacion'],
  ['País de residencia', 'paisResidencia'], ['Departamento de residencia', 'departamentoResidencia'], ['Teléfono', 'telefono'], ['Correo electrónico', 'email'],
  ['Valor total del negocio', 'valorInmueble', true], ['Valor total del inmueble', 'valorApartamento', true], ['Valor del parqueadero', 'valorParqueadero', true],
  ['Abonado total', 'totalAbonado', true], ['% recibido total', 'pctRecaudo', true], ['Por recibir', 'porRecibir', true],
  ['Valor de contado', 'valorCuotaInicial', true], ['Valor crédito', 'credito', true],
];

export function EncabezadoCarteraOlivInicial({ sort, onSort }) {
  return (
    <tr>
      {COLUMNAS.map(([label, key, centrada]) => (
        <th key={key} aria-sort={ariaSort(sort, key)}>
          <SortHeader label={label} sortKey={key} info={INFO_COLUMNAS_CARTERA_OLIV[key]} sort={sort} onSort={onSort} align={centrada ? 'center' : 'left'} />
        </th>
      ))}
    </tr>
  );
}

export function FilaCarteraOlivInicial({ f, onClick, onContextMenu, className }) {
  const cop = (v) => (v != null ? formatCOP(v) : '—');
  return (
    <tr onClick={onClick} onContextMenu={onContextMenu} className={className}>
      <td className={styles.numCellCentro}>{formatDate(f.fechaContrato)}</td>
      <td>{f.estado ?? '—'}</td>
      <td>{f.torre ?? '—'}</td>
      <td><Link to={`/oliv/negocios/${f.id}`}>{f.unidad ?? f.id}</Link></td>
      <td className={styles.numCellCentro}>{f.area != null ? f.area.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
      <td className={styles.truncar} title={f.comprador ?? ''}>{f.comprador ?? '—'}</td>
      <td>{f.tipoIdentificacion ?? '—'}</td>
      <td>{f.identificacion ?? '—'}</td>
      <td>{f.paisResidencia ?? '—'}</td>
      <td>{f.departamentoResidencia ?? '—'}</td>
      <td>{f.telefono ?? '—'}</td>
      <td className={styles.truncar} title={f.email ?? ''}>{f.email ?? '—'}</td>
      <td className={styles.numCellCentro}>{cop(f.valorInmueble)}</td>
      <td className={styles.numCellCentro}>{cop(f.valorApartamento)}</td>
      <td className={styles.numCellCentro}>{cop(f.valorParqueadero)}</td>
      <td className={styles.numCellCentro}>{formatCOP(f.totalAbonado ?? 0)}</td>
      <td className={styles.numCellCentro}>{fmtPct(f.pctRecaudo)}</td>
      <td className={styles.numCellCentro}>{cop(f.porRecibir)}</td>
      <td className={styles.numCellCentro}>{cop(f.valorCuotaInicial)}</td>
      <td className={styles.numCellCentro}>{cop(f.credito)}</td>
    </tr>
  );
}
