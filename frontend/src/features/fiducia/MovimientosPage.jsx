// Adaptado de zoho-payment-tracker/frontend/src/pages/FiduciaMovimientos.jsx.
// Ojo: en el legado esta pantalla NO usa el endpoint propio de Fiducia
// (`/api/fiducia/movimientos`, que de hecho queda huérfano -- ninguna
// página lo llama) sino `/api/negocios/movimientos` (getAllNegocioMovimientos):
// todos los movimientos con el contexto de Negocio ya resuelto (Fideicomiso/
// Nomenclatura/Estado/compradores) -- ver negocio.service.js:listMovimientos,
// portado durante la fase de Negocios. Mismos filtros, misma fila expandible
// con el grid completo de campos crudos, y la misma exportación a Excel
// estilizada (ExcelJS -- xlsx/SheetJS no permite estilos en su build libre),
// con el color de marca de Cartera en vez del teal de Baía Kristal.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Download, FileX2, ChevronDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { MultiSelect } from '../../components/ui/MultiSelect.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { listMovimientosNegocios, exportMovimientosNegocios } from '../../api/negocios.js';
import { filtrarKeysMovimiento } from '../../utils/columnasExcluidas.js';
import { descripcionProyecto, obtenerProyecto } from '../../utils/proyectos.js';
import { etiquetaCampoMovimiento, valorCampoMovimiento } from '../../utils/movimientoCampos.js';
import base from '../negocios/NegociosPage.module.css';
import styles from './MovimientosPage.module.css';
import { MovimientosTabla, formatCell, cleanNombre, shortFideicomiso } from './MovimientosTabla.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { TIPO_DESISTIMIENTO, opcionesMeses, rangoDelMes, exportarInformeDesistidosExcel, exportarInformeDesistidosPdf } from './informeDesistidos.js';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PRESETS = [
  { label: 'Último mes', months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
  { label: 'Último año', months: 12 },
];

// Ventana del informe mensual de desistidos: elige el mes y el formato; baja solo los movimientos DESISTIMIENTOS de ese mes.
function ModalInformeDesistidos({ open, onClose }) {
  const meses = opcionesMeses();
  const [mes, setMes] = useState(meses[1].value); // por defecto el mes anterior (el informe es mensual)
  const [formato, setFormato] = useState('xlsx');
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      const res = await exportMovimientosNegocios({ tipoMovimiento: [TIPO_DESISTIMIENTO], ...rangoDelMes(mes) });
      const movimientos = res.data?.data || [];
      if (movimientos.length === 0) {
        window.alert('No hay movimientos desistidos en ese mes.');
        return;
      }
      if (formato === 'xlsx') await exportarInformeDesistidosExcel({ mes, movimientos });
      else exportarInformeDesistidosPdf({ mes, movimientos });
      onClose();
    } catch (err) {
      window.alert(`Error al generar el informe de desistidos: ${err.message}`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={generando ? () => {} : onClose}
      title="Informe de desistidos"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={generando}>Cancelar</Button>
          <Button onClick={generar} disabled={generando}>{generando ? 'Generando…' : 'Generar'}</Button>
        </>
      )}
    >
      <div className={styles.informeCampos}>
        <Field label="Mes">
          {(p) => (
            <Select {...p} value={mes} onChange={(e) => setMes(e.target.value)} disabled={generando}>
              {meses.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          )}
        </Field>
        <fieldset className={styles.informeFormato}>
          <legend>Formato</legend>
          <label><input type="radio" name="formato-desistidos" checked={formato === 'xlsx'} onChange={() => setFormato('xlsx')} disabled={generando} /> Excel</label>
          <label><input type="radio" name="formato-desistidos" checked={formato === 'pdf'} onChange={() => setFormato('pdf')} disabled={generando} /> PDF</label>
        </fieldset>
        <p className={styles.informeNota}>
          Solo movimientos de desistimiento con fecha contable en ese mes. El Excel trae un resumen por negocio (aportes devueltos, GMF y penalidades) y el detalle de cada movimiento; el PDF, el resumen.
        </p>
      </div>
    </Modal>
  );
}

// Un solo botón "Exportar" con menú: los movimientos que se ven en la tabla, e informes.
function MenuExportar({ onExportMovimientos, exportando, sinResultados, total }) {
  const [abierto, setAbierto] = useState(false);
  const [informeAbierto, setInformeAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrar(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className={base.exportWrap} ref={ref}>
      <Button variant="secondary" onClick={() => setAbierto((a) => !a)} disabled={exportando} aria-haspopup="menu" aria-expanded={abierto}>
        <span className={base.botonInterior}>
          <Download size={14} aria-hidden="true" />
          {exportando ? 'Exportando…' : 'Exportar'}
          <ChevronDown size={14} aria-hidden="true" />
        </span>
      </Button>
      {abierto && (
        <div className={`${base.exportMenu} ${styles.menuExportar}`} role="menu">
          <p className={styles.menuSeccion}>Movimientos</p>
          <button type="button" role="menuitem" className={base.exportOption} disabled={sinResultados} onClick={() => { setAbierto(false); onExportMovimientos(); }}>
            <span className={styles.menuTitulo}>Excel con los filtros actuales</span>
            <span className={styles.menuDesc}>{total != null ? `${total.toLocaleString('es-CO')} movimientos` : 'Todos los movimientos filtrados'}</span>
          </button>
          <p className={styles.menuSeccion}>Informes</p>
          <button type="button" role="menuitem" className={base.exportOption} onClick={() => { setAbierto(false); setInformeAbierto(true); }}>
            <span className={styles.menuTitulo}><FileX2 size={14} aria-hidden="true" /> Informe de desistidos del mes…</span>
            <span className={styles.menuDesc}>Resumen por negocio y detalle, en Excel o PDF</span>
          </button>
        </div>
      )}
      <ModalInformeDesistidos open={informeAbierto} onClose={() => setInformeAbierto(false)} />
    </div>
  );
}

export function MovimientosPage() {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);

  const [search, setSearch] = useState('');
  const [fideicomisoFilter, setFideicomisoFilter] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState([]);
  const [tipoMovFilter, setTipoMovFilter] = useState([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [datePreset, setDatePreset] = useState('');

  const debouncedSearch = useDebounce(search);
  const filtrosRef = useRef({});
  filtrosRef.current = { debouncedSearch, fideicomisoFilter, estadoFilter, tipoMovFilter, fechaDesde, fechaHasta };

  const cargar = useCallback((p = 1) => {
    const { debouncedSearch: s, fideicomisoFilter: f, estadoFilter: e, tipoMovFilter: tm, fechaDesde: fd, fechaHasta: fh } = filtrosRef.current;
    setCargando(true);
    listMovimientosNegocios({ search: s, fideicomiso: f, estado: e, tipoMovimiento: tm, fechaDesde: fd, fechaHasta: fh, page: p, limit: 50 })
      .then((res) => { setResultado(res.data); setPagina(p); })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(1); }, [debouncedSearch, fideicomisoFilter, estadoFilter, tipoMovFilter, fechaDesde, fechaHasta, cargar]);

  function clearAll() {
    setSearch(''); setFideicomisoFilter([]); setEstadoFilter([]); setTipoMovFilter([]); setFechaDesde(''); setFechaHasta(''); setDatePreset('');
  }
  const hasFilters = search || fideicomisoFilter.length || estadoFilter.length || tipoMovFilter.length || fechaDesde || fechaHasta;

  async function handleExport() {
    const { debouncedSearch: s, fideicomisoFilter: f, estadoFilter: e, tipoMovFilter: tm, fechaDesde: fd, fechaHasta: fh } = filtrosRef.current;
    setExportando(true);
    try {
      const res = await exportMovimientosNegocios({ search: s, fideicomiso: f, estado: e, tipoMovimiento: tm, fechaDesde: fd, fechaHasta: fh });
      const rows = res.data?.data || [];
      if (rows.length === 0) return;

      const datosKeys = [];
      const seen = new Set();
      for (const mov of rows) {
        for (const k of filtrarKeysMovimiento(Object.keys(mov.datos || {}))) {
          if (!seen.has(k)) { seen.add(k); datosKeys.push(k); }
        }
      }

      const headers = ['Referencia', 'Proyecto', 'Nomenclatura', 'Comprador(es)', 'Cédula(s)', 'Estado negocio', ...datosKeys.map(etiquetaCampoMovimiento)];
      const excelRows = rows.map((mov) => {
        const neg = mov.negocio;
        const compradores = (neg?.compradores || []).map((c) => cleanNombre(c.nombre)).filter(Boolean).join(' | ');
        const cedulas = (neg?.compradores || []).map((c) => c.nroId || '').filter(Boolean).join(' | ');
        const fila = [
          mov.referencia ?? '',
          neg?.fideicomiso ? shortFideicomiso(neg.fideicomiso) : '',
          neg?.nomenclatura ?? '',
          compradores,
          cedulas,
          neg?.estado ?? '',
        ];
        const datos = mov.datos || {};
        for (const k of datosKeys) {
          const v = valorCampoMovimiento(k, datos[k]);
          fila.push(v != null && v !== '' ? (formatCell(k, v) ?? String(v)) : '');
        }
        return fila;
      });

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Movimientos');
      ws.addRow(headers);
      excelRows.forEach((fila) => ws.addRow(fila));

      const headerRow = ws.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232BED' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { vertical: 'middle' };
      });
      headerRow.height = 20;

      headers.forEach((h, i) => {
        let maxLen = h.length;
        for (const fila of excelRows) {
          const len = String(fila[i] ?? '').length;
          if (len > maxLen) maxLen = len;
        }
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 12), 60);
      });
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      a.download = `movimientos-fiduciarios-${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(`Error al exportar los movimientos: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }

  const pagination = resultado?.pagination;
  const movimientos = resultado?.data || [];
  const fideicomisos = [...(resultado?.fideicomisos || [])].sort((a, b) => {
    const matchA = String(a).match(/^(\d{4,6})/);
    const matchB = String(b).match(/^(\d{4,6})/);
    const etapaA = matchA ? obtenerProyecto(matchA[1])?.etapa : null;
    const etapaB = matchB ? obtenerProyecto(matchB[1])?.etapa : null;
    if (etapaA != null && etapaB != null) return parseInt(etapaA, 10) - parseInt(etapaB, 10);
    if (etapaA != null) return -1;
    if (etapaB != null) return 1;
    const labelA = (matchA && descripcionProyecto(matchA[1])) || shortFideicomiso(a);
    const labelB = (matchB && descripcionProyecto(matchB[1])) || shortFideicomiso(b);
    return String(labelA).localeCompare(String(labelB), 'es');
  });
  const estados = resultado?.estados || [];
  const tiposMov = resultado?.tiposMovimiento || [];

  return (
    <div className={base.page}>
      <div className={base.header}>
        <div>
          <h1 className={base.title}>Movimientos fiduciarios</h1>
          <p className={base.subtitle}>
            Todos los movimientos de los encargos de Baía Kristal{pagination ? ` · ${pagination.total.toLocaleString('es-CO')} resultados` : ''}
          </p>
        </div>
        <div className={base.acciones}>
          <MenuExportar onExportMovimientos={handleExport} exportando={exportando} sinResultados={!pagination || pagination.total === 0} total={pagination?.total} />
        </div>
      </div>

      <div className={base.filtros}>
        <div className={base.filtroBusqueda}>
          <Field
            label={
              <span className={base.labelConIcono}>
                <Search size={13} />
                Buscar
              </span>
            }
          >
            {(p) => <TextInput {...p} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Referencia, comprador, cédula, ID o nomenclatura…" />}
          </Field>
        </div>
        {fideicomisos.length > 0 && (
          <Field label="Proyecto / Fideicomiso">
            {(p) => (
              <MultiSelect
                {...p}
                options={fideicomisos.map((f) => {
                  const match = String(f).match(/^(\d{4,6})/);
                  const desc = match ? descripcionProyecto(match[1]) : null;
                  return { value: f, label: desc || shortFideicomiso(f) };
                })}
                value={fideicomisoFilter}
                onChange={setFideicomisoFilter}
                placeholder="Todos los proyectos"
              />
            )}
          </Field>
        )}
        {estados.length > 0 && (
          <Field label="Estado del negocio">
            {(p) => (
              <MultiSelect {...p} options={estados} value={estadoFilter} onChange={setEstadoFilter} placeholder="Todos los estados" />
            )}
          </Field>
        )}
        {tiposMov.length > 0 && (
          <Field label="Tipo de movimiento">
            {(p) => (
              <MultiSelect {...p} options={tiposMov} value={tipoMovFilter} onChange={setTipoMovFilter} placeholder="Todos los tipos" />
            )}
          </Field>
        )}
        <Field label="Fecha contable desde">
          {(p) => <TextInput {...p} type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setDatePreset(''); }} />}
        </Field>
        <Field label="Fecha contable hasta">
          {(p) => <TextInput {...p} type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setDatePreset(''); }} />}
        </Field>
        <div className={styles.presets}>
          <span className={styles.presetsTitulo}>Rango rápido</span>
          {PRESETS.map(({ label, months }) => (
            <button
              key={months}
              type="button"
              className={`${base.chip} ${datePreset === String(months) ? base.chipActivo : ''}`}
              onClick={() => {
                const now = new Date();
                const hasta = now.toISOString().slice(0, 10);
                const desde = new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).toISOString().slice(0, 10);
                setFechaDesde(desde);
                setFechaHasta(hasta);
                setDatePreset(String(months));
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button type="button" className={base.limpiar} onClick={clearAll}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className={base.tableWrap}>
        {cargando && !resultado ? (
          <p className={base.mensaje}>Cargando…</p>
        ) : movimientos.length === 0 ? (
          <div className={base.vacio}>
            <p className={base.vacioTitulo}>Sin movimientos</p>
            <p className={base.vacioTexto}>{hasFilters ? 'Ajusta los filtros para ver resultados.' : 'Sincroniza los datos desde el módulo Negocios.'}</p>
          </div>
        ) : (
          <>
            <MovimientosTabla movimientos={movimientos} />
            {pagination && <Pagination page={pagina} pageSize={pagination.limit} total={pagination.total} onPageChange={cargar} />}
          </>
        )}
      </div>
    </div>
  );
}
