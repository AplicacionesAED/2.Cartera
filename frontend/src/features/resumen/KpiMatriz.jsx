// KPIs gerenciales del Resumen en una sola tarjeta compacta (Baía Kristal y Oliv): una fila por parte del negocio (Total
// 100%, Cuota inicial 30%, Crédito/Saldo 70%) y una columna por cifra (Totalidad, Recaudado, Por recaudar, % recaudo y
// Cuotas vencidas), más una línea de inventario. Pasar el mouse por una cifra muestra de dónde sale (`descripcion`).
// Los valores llegan ya formateados; `pct` es un número (0-100) o null.
import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import styles from './KpiMatriz.module.css';

function Cifra({ valor, descripcion, className = '' }) {
  const contenido = <span className={`${styles.valor} ${className}`}>{valor}</span>;
  return descripcion ? <InfoTooltip text={descripcion}>{contenido}</InfoTooltip> : contenido;
}

function Porcentaje({ pct, descripcion }) {
  if (pct == null) return <span className={styles.valor}>—</span>;
  const barra = (
    <span className={styles.pct}>
      <span className={styles.valor}>{pct.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
      <span className={styles.pista} aria-hidden="true"><span className={styles.relleno} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></span>
    </span>
  );
  return descripcion ? <InfoTooltip text={descripcion}>{barra}</InfoTooltip> : barra;
}

// filas: [{ clave, label, totalidad, recaudado, porRecaudar: { valor, descripcion }, pct, vencidas: { cantidad, monto, descripcion } | null }]
// inventario: [{ label, valor, sub, descripcion }]
export function KpiMatriz({ titulo, notaTitulo, filas, inventarioTitulo, inventarioNota, inventario = [] }) {
  return (
    <section className={styles.tarjeta} aria-label={titulo}>
      <h3 className={styles.titulo}>
        {titulo}
        {notaTitulo && <InfoTooltip text={notaTitulo} />}
      </h3>
      <div className={styles.scroll}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th scope="col" className={styles.colLabel} />
              <th scope="col">Totalidad</th>
              <th scope="col">Recaudado</th>
              <th scope="col">Por recaudar</th>
              <th scope="col">% recaudo</th>
              <th scope="col">Cuotas vencidas (actual)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.clave}>
                <th scope="row" className={styles.colLabel}>{f.label}</th>
                <td><Cifra valor={f.totalidad.valor} descripcion={f.totalidad.descripcion} className={styles.fuerte} /></td>
                <td><Cifra valor={f.recaudado.valor} descripcion={f.recaudado.descripcion} className={styles.exito} /></td>
                <td><Cifra valor={f.porRecaudar.valor} descripcion={f.porRecaudar.descripcion} /></td>
                <td><Porcentaje pct={f.pct} descripcion="Recaudado ÷ Totalidad." /></td>
                <td>
                  {f.vencidas ? (
                    <InfoTooltip text={f.vencidas.descripcion}>
                      <span className={`${styles.valor} ${styles.alerta}`}>
                        {f.vencidas.cantidad}
                        {f.vencidas.monto && <span className={styles.sub}> · {f.vencidas.monto}</span>}
                      </span>
                    </InfoTooltip>
                  ) : (
                    <span className={styles.valor}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {inventario.length > 0 && (
        <div className={styles.inventario}>
          <span className={styles.inventarioTitulo}>
            {inventarioTitulo}
            {inventarioNota && <InfoTooltip text={inventarioNota} />}
          </span>
          {inventario.map((i) => (
            <InfoTooltip key={i.label} text={i.descripcion}>
              <span className={styles.inventarioItem}>
                <span className={styles.inventarioEtiqueta}>{i.label}</span>
                <span className={styles.valor}>{i.valor}</span>
                {i.sub && <span className={styles.sub}>· {i.sub}</span>}
              </span>
            </InfoTooltip>
          ))}
        </div>
      )}
    </section>
  );
}
