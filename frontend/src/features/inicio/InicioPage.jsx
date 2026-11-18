// Inicio: pantalla de arranque con que mirar primero. Por proyecto (Baia Kristal /
// Oliv, mismo selector que el resto de la app): 4 KPIs, un panel de alertas
// accionables y accesos rapidos a los modulos que el usuario tiene permitidos.
// Todo lo calcula GET /inicio (modules/inicio) sobre los mismos caches que
// Dashboard/Cartera/Otrosies; el backend ya omite lo que el usuario no puede abrir.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, AlertOctagon, AlertTriangle, Info, CheckCircle2,
  ChevronRight, RefreshCw, FileText, Building2, Briefcase, Warehouse, Landmark, ArrowLeftRight,
  BarChart3, LayoutDashboard, Target,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { tienePermiso } from '../../utils/permisos.js';
import { formatCOP, formatDateTime } from '../../utils/format.js';
import { getInicio } from '../../api/inicio.js';
import { ACCESOS_RAPIDOS } from './accesosRapidos.js';
import dashStyles from '../dashboard/Dashboard.module.css';
import styles from './Inicio.module.css';

const ICONOS_ALERTA = { danger: AlertOctagon, warning: AlertTriangle, info: Info };

const ICONOS_ACCESO = {
  Oportunidades: Target,
  Negocios: Briefcase,
  Inmuebles: Warehouse,
  Encargos: Landmark,
  Movimientos: ArrowLeftRight,
  Resumen: BarChart3,
  Dashboard: LayoutDashboard,
  Cartera: Wallet,
  'Otrosíes': FileText,
};

function saludo() {
  const hora = Number(new Intl.DateTimeFormat('es-CO', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(new Date()));
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatearValor(kpi) {
  return kpi.tipo === 'moneda' ? formatCOP(kpi.valor) : new Intl.NumberFormat('es-CO').format(kpi.valor);
}

// Estado de la ultima sincronizacion del CRM del proyecto, en el encabezado.
function ChipSync({ sync }) {
  if (!sync || sync.status === 'never') return <span className={`${styles.chipSync} ${styles.sinSync}`}><RefreshCw size={13} /> Sin sincronizaciones</span>;
  if (sync.status === 'error') return <span className={`${styles.chipSync} ${styles.errorSync}`}><RefreshCw size={13} /> Última sincronización con error</span>;
  return (
    <span className={styles.chipSync}>
      <RefreshCw size={13} /> Última sincronización: {formatDateTime(sync.finalizadoEn ?? sync.iniciadoEn)}
    </span>
  );
}

function Alertas({ alertas }) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitulo}>Requiere tu atención</h2>
        {alertas.length > 0 && <span className={styles.contador}>{alertas.length}</span>}
      </header>
      {alertas.length === 0 ? (
        <div className={styles.alDia}>
          <span className={styles.alDiaIcono}><CheckCircle2 size={20} /></span>
          <div className={styles.alDiaCuerpo}>
            <p className={styles.alDiaTitulo}>Estás al día</p>
            <p className={styles.alDiaTexto}>No hay alertas pendientes para este proyecto.</p>
          </div>
        </div>
      ) : (
        <ul className={styles.listaAlertas}>
          {alertas.map((a) => {
            const Icono = ICONOS_ALERTA[a.tipo] ?? Info;
            return (
              <li key={a.id}>
                {a.to ? (
                  <Link to={a.to} className={styles.alerta}>
                  <span className={`${styles.alertaIcono} ${styles[`sev_${a.tipo}`]}`}><Icono size={18} strokeWidth={1.9} /></span>
                  <span className={styles.alertaTexto}>
                    <span className={styles.alertaTitulo}>{a.titulo}</span>
                    <span className={styles.alertaDetalle}>{a.detalle}</span>
                  </span>
                  <span className={styles.alertaCifras}>
                    {a.cuenta != null && <span className={`${styles.alertaCuenta} ${styles[`sev_${a.tipo}`]}`}>{new Intl.NumberFormat('es-CO').format(a.cuenta)}</span>}
                    {a.monto != null && <span className={styles.alertaMonto}>{formatCOP(a.monto)}</span>}
                  </span>
                  <ChevronRight size={16} className={styles.alertaChevron} aria-hidden="true" />
                  </Link>
                ) : (
                  <div className={styles.alerta}>
                  <span className={`${styles.alertaIcono} ${styles[`sev_${a.tipo}`]}`}><Icono size={18} strokeWidth={1.9} /></span>
                  <span className={styles.alertaTexto}>
                    <span className={styles.alertaTitulo}>{a.titulo}</span>
                    <span className={styles.alertaDetalle}>{a.detalle}</span>
                  </span>
                  <span className={styles.alertaCifras}>
                    {a.cuenta != null && <span className={`${styles.alertaCuenta} ${styles[`sev_${a.tipo}`]}`}>{new Intl.NumberFormat('es-CO').format(a.cuenta)}</span>}
                    {a.monto != null && <span className={styles.alertaMonto}>{formatCOP(a.monto)}</span>}
                  </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function AccesosRapidos({ grupo, usuario }) {
  const items = useMemo(
    () => grupo.items.filter((i) => tienePermiso(usuario?.roles, i.permiso, usuario?.permisosPorRol, usuario?.esAdmin)),
    [grupo, usuario]
  );
  if (items.length === 0) return null;
  return (
    <section className={styles.accesos}>
      <h2 className={styles.panelTitulo}>Accesos rápidos</h2>
      <div className={styles.accesosGrid}>
        {items.map((item) => {
          const Icono = ICONOS_ACCESO[item.label] ?? Building2;
          return (
            <Link key={item.to} to={item.to} className={styles.acceso}>
              <span className={styles.accesoIcono}><Icono size={20} strokeWidth={1.75} /></span>
              <span className={styles.accesoLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function InicioPage() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [proyecto, setProyecto] = usePersistentState('inicio:proyecto', 'baia');

  useEffect(() => {
    let vigente = true;
    getInicio()
      .then((res) => { if (vigente) setDatos(res.data); })
      .catch((err) => { if (vigente) setError(err.message); });
    return () => { vigente = false; };
  }, []);

  const disponibles = datos ? ['baia', 'oliv'].filter((k) => datos[k]) : [];
  const activo = disponibles.includes(proyecto) ? proyecto : disponibles[0];
  const actual = activo ? datos[activo] : null;
  const grupo = ACCESOS_RAPIDOS[activo] ?? null;

  const primerNombre = (usuario?.nombre ?? '').split(' ')[0];
  const hoy = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }).format(new Date());

  const nAlertas = actual?.alertas.length ?? 0;
  const nCriticas = actual?.alertas.filter((a) => a.tipo === 'danger').length ?? 0;
  const frase = !actual
    ? 'Cargando tu resumen…'
    : nAlertas === 0
      ? 'Estás al día: no hay alertas pendientes.'
      : `Hay ${nAlertas} ${nAlertas === 1 ? 'alerta pendiente' : 'alertas pendientes'}${nCriticas > 0 ? `, ${nCriticas} ${nCriticas === 1 ? 'crítica' : 'críticas'}` : ''}.`;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroTexto}>
            <h1 className={styles.heroTitulo}>{saludo()}{primerNombre ? `, ${primerNombre}` : ''}</h1>
            <p className={styles.heroFrase}>{datos && !actual ? 'Sin acceso a módulos de cartera.' : frase}</p>
            <p className={styles.heroFecha}>{hoy}</p>
          </div>
          <div className={styles.headerLado}>
            {actual && <ChipSync sync={actual.sync} />}
            {disponibles.length > 1 && (
              <div className={styles.heroToggle} role="tablist" aria-label="Proyecto">
                {disponibles.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={activo === k}
                    className={`${styles.heroToggleBtn} ${activo === k ? styles.heroToggleBtnActivo : ''}`}
                    onClick={() => setProyecto(k)}
                  >
                    {datos[k].nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {actual && actual.kpis.length > 0 && (
          <dl className={styles.cifras}>
            {actual.kpis.map((kpi) => (
              <Link key={kpi.key} to={kpi.to} className={styles.cifra}>
                <dd className={`${styles.cifraValor} ${Number(kpi.valor) === 0 ? styles.cifraCero : ''} ${kpi.advertencia ? styles.cifraAlerta : ''}`}>{formatearValor(kpi)}</dd>
                <dt className={styles.cifraLabel}>{kpi.label}</dt>
                {kpi.sub && <span className={styles.cifraSub}>{kpi.sub}</span>}
              </Link>
            ))}
          </dl>
        )}
      </header>

      {error && <div className={dashStyles.formError}>{error}</div>}

      {!datos && !error && (
        <div className={styles.esqueleto} aria-busy="true" aria-label="Cargando inicio">
          <div className={styles.esqueletoFila}>{[0, 1, 2, 3].map((i) => <span key={i} className={styles.esqueletoKpi} />)}</div>
          <span className={styles.esqueletoPanel} />
        </div>
      )}

      {datos && !actual && (
        <p className={dashStyles.emptyHint}>Tu rol todavía no tiene acceso a ningún módulo de cartera. Pide a un administrador que te asigne los permisos.</p>
      )}

      {actual && (
        <>
          <div className={styles.cuerpo}>
            <Alertas alertas={actual.alertas} />
            {grupo && <AccesosRapidos grupo={grupo} usuario={usuario} />}
          </div>
        </>
      )}
    </div>
  );
}
