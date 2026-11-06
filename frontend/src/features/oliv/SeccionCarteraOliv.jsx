// Informe de ventas de Oliv (negocios con cuota inicial en mora) dentro del Resumen, bajo el Consolidado: las mismas
// 20 columnas y el mismo cálculo que la pantalla Cartera en Gestión (GET /oliv/resumen/cartera-mora), filtrada por la Torre y
// el Estado del inmueble de la barra del Resumen. Clic en una fila abre el negocio.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import { getCarteraMoraOliv } from '../../api/olivResumen.js';
import { descargarCarteraOliv } from './exportarCarteraOliv.js';
import { EncabezadoCarteraOlivInicial, FilaCarteraOlivInicial, COLUMNAS_CARTERA_OLIV_INICIAL } from './TablaCarteraOliv.jsx';
import dashStyles from '../dashboard/Dashboard.module.css';
import carteraStyles from '../cartera-mora/CarteraMoraPage.module.css';
import styles from '../resumen/ResumenPage.module.css';

const LIMIT = 50;

export function SeccionCarteraOliv({ torre, estadoInmueble }) {
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [exportando, setExportando] = useState(false);
  const ultimaPeticion = useRef(0);

  // Cambiar un filtro vuelve a la primera página.
  const clave = JSON.stringify([torre, estadoInmueble]);
  useEffect(() => { setPagina(1); }, [clave]);

  useEffect(() => {
    const id = ++ultimaPeticion.current;
    setCargando(true);
    getCarteraMoraOliv({
      vista: 'inicial',
      torre: torre?.length ? torre : undefined,
      estadoInmueble: estadoInmueble?.length ? estadoInmueble : undefined,
      sortBy: sort.key ?? undefined,
      sortDir: sort.direction ?? undefined,
      page: pagina,
      limit: LIMIT,
    })
      .then((res) => {
        if (id !== ultimaPeticion.current) return;
        setResultado(res.data);
        setError(null);
      })
      .catch((err) => { if (id === ultimaPeticion.current) setError(err.message); })
      .finally(() => { if (id === ultimaPeticion.current) setCargando(false); });
  }, [clave, sort, pagina]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
    setPagina(1);
  }

  // Excel con TODAS las filas que cumplen los filtros y el orden actuales (no solo la página que se ve).
  async function exportar() {
    setExportando(true);
    try {
      const res = await getCarteraMoraOliv({
        vista: 'inicial',
        torre: torre?.length ? torre : undefined,
        estadoInmueble: estadoInmueble?.length ? estadoInmueble : undefined,
        sortBy: sort.key ?? undefined,
        sortDir: sort.direction ?? undefined,
        page: 1,
        limit: 9999,
      });
      await descargarCarteraOliv(res.data.data, `oliv-informe-de-ventas-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(false);
    }
  }

  // Clic en la fila abre el negocio, salvo que sea sobre un enlace o que se esté seleccionando texto.
  function abrirFila(e, fila) {
    if (e.target.closest('a, button, input, select')) return;
    if (window.getSelection()?.toString()) return;
    navigate(`/oliv/negocios/${fila.id}`);
  }

  const filas = resultado?.data ?? [];
  const paginacion = resultado?.pagination;

  return (
    <div className={styles.consolidadoCard}>
      <div className={styles.consolidadoCabecera}>
        <div>
          <h2 className={styles.consolidadoTitulo}>
            Informe de ventas
            <InfoTooltip text="Negocios con cuotas atrasadas de la Cuota Inicial (no incluye el saldo final), con los datos del comprador y los valores del negocio. Se calcula en vivo contra los movimientos reales de la fiducia." />
          </h2>
          <p className={styles.consolidadoSubtitulo}>
            {paginacion ? `${paginacion.total.toLocaleString('es-CO')} negocios en mora. ` : ''}
            Filtrada por Torre y Estado del inmueble de la barra de arriba. Pasa el cursor sobre los encabezados para ver de dónde sale cada columna.
          </p>
        </div>
        <Button variant="secondary" onClick={exportar} disabled={exportando || cargando || !paginacion || paginacion.total === 0}>
          <Download size={14} /> {exportando ? 'Exportando…' : 'Exportar a Excel'}
        </Button>
      </div>

      {error && <div className={dashStyles.formError}>{error}</div>}
      {resultado && resultado.cotizacionesDisponibles === false && <div className={dashStyles.formError}>No se pudo leer el plan de pagos de las cotizaciones (Centro de Aplicaciones Comerciales). Sin ese plan no se calcula la mora y esta tabla sale vacía. Revisa que esa aplicación esté en línea y vuelve a cargar.</div>}
      {cargando && !resultado ? (
        <p className={dashStyles.loadingState}>Cargando…</p>
      ) : (
        <>
          <div className={carteraStyles.tableScroll}>
            <table className={dashStyles.table}>
              <thead>
                <EncabezadoCarteraOlivInicial sort={sort} onSort={toggleSort} />
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr><td colSpan={COLUMNAS_CARTERA_OLIV_INICIAL} className={carteraStyles.sinResultados}>Sin resultados.</td></tr>
                ) : (
                  filas.map((f) => <FilaCarteraOlivInicial key={f.id} f={f} onClick={(e) => abrirFila(e, f)} className={carteraStyles.filaCtxMenu} />)
                )}
              </tbody>
            </table>
          </div>
          {paginacion && <Pagination page={pagina} pageSize={paginacion.limit} total={paginacion.total} onPageChange={setPagina} />}
        </>
      )}
    </div>
  );
}
