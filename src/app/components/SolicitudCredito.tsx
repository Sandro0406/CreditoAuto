import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Car, CreditCard, Clock, Save, X, User, ShieldCheck, FileText } from 'lucide-react';
import Layout from './Layout';
import { calcularMontoPrestamo, toNumber } from '../lib/financialCalculations';
import { getClients } from '../lib/api/clients';
import { createLoan, updateLoan, getLoanByExternalCode } from '../lib/api/loans';
import { calculateAndPersistAmortization } from '../lib/api/amortization';
import { getSettings } from '../lib/api/settings';
import { validateLoanAgainstSettings } from '../lib/approval';
import { useAppSettings } from '../context/SettingsContext';
import { paths } from '../lib/routes';
import type { Cliente, Solicitud } from '../lib/types';

const emptyForm = {
  cliente_id: '',
  marca_vehiculo: '',
  modelo_vehiculo: '',
  precio_vehiculo: '',
  cuota_inicial: '',
  tasa_descuento: '',
  tasa_interes: '',
  tipo_tasa: 'Efectiva',
  capitalizacion: 'Mensual',
  frecuencia_pago: 'Mensual',
  plazo_credito: '',
  periodo_gracia: '0',
  tipo_gracia: 'Ninguno',
  moneda: 'Soles',
  fecha_inicio: new Date().toISOString().split('T')[0],
  valor_residual: '0',
  pct_seguro_desgravamen: '',
  seguro_riesgo: '',
  gps: '',
  portes: '',
  gastos_administrativos: '',
  costo_notarial: '',
  costo_registral: '',
  costo_tasacion: '',
  comision_estudio: '',
  comision_activacion: '',
  periodos_gracia_total: '0',
  periodos_gracia_parcial: '0',
};

export default function SolicitudCredito() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id && location.pathname.endsWith('/editar'));
  const { settings } = useAppSettings();

  const [solicitudEditar, setSolicitudEditar] = useState<Solicitud | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>(emptyForm);

  const loadDefaults = useCallback(async () => {
    if (isEdit) return;
    try {
      const cfg = await getSettings();
      setFormData(prev => ({
        ...prev,
        moneda: cfg.monedaDefecto,
        tasa_interes: cfg.tasaInteresDefecto,
        tipo_tasa: cfg.tipoTasaDefecto,
        capitalizacion: cfg.capitalizacionDefecto,
        pct_seguro_desgravamen: cfg.pctSeguroDesgravamenDefecto,
        seguro_riesgo: cfg.seguroRiesgoDefecto,
        gps: cfg.gpsDefecto,
        portes: cfg.portesDefecto,
        gastos_administrativos: cfg.gastosAdminDefecto,
        costo_notarial: cfg.costoNotarialDefecto,
        costo_registral: cfg.costoRegistralDefecto,
        costo_tasacion: cfg.costoTasacionDefecto,
        comision_estudio: cfg.comisionEstudioDefecto,
        comision_activacion: cfg.comisionActivacionDefecto,
      }));
    } catch {
      // defaults already set
    }
  }, [isEdit]);

  useEffect(() => {
    getClients().then(setClientes).catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) {
      loadDefaults();
      return;
    }
    setLoading(true);
    getLoanByExternalCode(id)
      .then((sol) => {
        if (!sol) {
          setError('Solicitud no encontrada');
          return;
        }
        setSolicitudEditar(sol);
        setFormData({ ...sol } as Record<string, string>);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar solicitud');
      })
      .finally(() => setLoading(false));
  }, [isEdit, id, loadDefaults]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const precioVehiculo = toNumber(formData.precio_vehiculo);
    const cuotaInicial = toNumber(formData.cuota_inicial);
    const valorResidual = toNumber(formData.valor_residual);
    const costesIniciales =
      toNumber(formData.costo_notarial) +
      toNumber(formData.costo_registral) +
      toNumber(formData.costo_tasacion) +
      toNumber(formData.comision_estudio) +
      toNumber(formData.comision_activacion);

    if (cuotaInicial >= precioVehiculo) {
      alert('La cuota inicial debe ser menor al precio del vehículo.');
      return;
    }
    if (valorResidual >= precioVehiculo - cuotaInicial) {
      alert('El valor residual debe ser menor al monto a financiar.');
      return;
    }

    const plazo = toNumber(formData.plazo_credito);
    const financed = calcularMontoPrestamo(precioVehiculo, cuotaInicial, costesIniciales);
    const limitError = validateLoanAgainstSettings(financed, plazo, settings);
    if (limitError) {
      setError(limitError);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && solicitudEditar) {
        const actualizada = await updateLoan({
          ...formData,
          id: solicitudEditar.id,
          monto_prestamo: calcularMontoPrestamo(precioVehiculo, cuotaInicial, costesIniciales).toFixed(2),
          fecha_solicitud: solicitudEditar.fecha_solicitud,
          estado: solicitudEditar.estado,
        } as Solicitud);
        // Recalcula y persiste el cronograma con los datos nuevos: evita que
        // Cálculos Financieros quede mostrando un cronograma desactualizado.
        await calculateAndPersistAmortization(actualizada);
        alert('Solicitud actualizada exitosamente');
        navigate(paths.solicitudDetalle(solicitudEditar.id));
      } else {
        const created = await createLoan(formData);
        alert(`Solicitud registrada. Estado inicial: ${created.estado}`);
        navigate(paths.solicitudes);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; details?: string; hint?: string };
      const msg = e?.message
        ? [e.message, e.details, e.hint].filter(Boolean).join(' — ')
        : 'Error al guardar solicitud';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "input-soft";
  const selectClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const hintClass = "text-xs text-slate-400 mt-0.5";

  const precioNum = toNumber(formData.precio_vehiculo);
  const cuotaInicialNum = toNumber(formData.cuota_inicial);
  const vrNum = toNumber(formData.valor_residual);
  const costesInicialesNum =
    toNumber(formData.costo_notarial) +
    toNumber(formData.costo_registral) +
    toNumber(formData.costo_tasacion) +
    toNumber(formData.comision_estudio) +
    toNumber(formData.comision_activacion);
  const montoFinanciado = Math.max(precioNum - cuotaInicialNum, 0) + costesInicialesNum;
  const sym = formData.moneda === 'Soles' ? 'S/' : '$';

  if (loading) {
    return (
      <Layout pageTitle={isEdit ? 'Editar solicitud' : 'Nueva solicitud'} pageSubtitle="Solicitudes">
        <p className="text-slate-500 text-sm text-center py-16">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle={isEdit ? 'Editar solicitud' : 'Nueva solicitud'}
      pageSubtitle="Solicitudes"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-xs">{error}</div>}
        {!isEdit && (
          <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-xs text-brand-900">
            Políticas activas: auto-aprobación hasta {Number(settings.autoaprobacionHasta).toLocaleString('es-PE')},
            monto máx. {Number(settings.montoMaximo).toLocaleString('es-PE')},
            plazo máx. {settings.plazoMaximo} meses.
            {settings.requiereAprobacionGerencia && ' Montos mayores requieren aprobación de gerencia.'}
          </div>
        )}

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-700" />
            <p className="font-semibold text-slate-700 text-sm">Cliente</p>
          </div>
          <div className="p-5">
            <label className={labelClass}>Cliente Asociado</label>
            <select name="cliente_id" value={formData.cliente_id || ''} onChange={handleChange} className={selectClass}>
              <option value="">— Sin cliente asociado —</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_cliente} — DNI: {c.dni_cliente}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Datos del Vehículo</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Marca *</label>
              <input type="text" name="marca_vehiculo" value={formData.marca_vehiculo} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Modelo *</label>
              <input type="text" name="modelo_vehiculo" value={formData.modelo_vehiculo} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Precio Total *</label>
              <input type="number" name="precio_vehiculo" value={formData.precio_vehiculo} onChange={handleChange} className={inputClass} required step="0.01" min="0.01" />
            </div>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-700" />
            <p className="font-semibold text-slate-700 text-sm">Condiciones del Crédito</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Moneda *</label>
              <select name="moneda" value={formData.moneda} onChange={handleChange} className={selectClass} required>
                <option value="Soles">Soles (S/)</option>
                <option value="Dólares">Dólares ($)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cuota Inicial *</label>
              <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleChange} className={inputClass} required step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Valor Residual / Cuota Balón</label>
              <input type="number" name="valor_residual" value={formData.valor_residual} onChange={handleChange} className={inputClass} step="0.01" min="0" />
              <p className={hintClass}>Compra Inteligente — pago al final</p>
            </div>
            <div>
              <label className={labelClass}>Tasa de Interés (%) *</label>
              <input type="number" name="tasa_interes" value={formData.tasa_interes} onChange={handleChange} className={inputClass} required step="0.0001" min="0.0001" />
            </div>
            <div>
              <label className={labelClass}>Tipo de Tasa *</label>
              <select name="tipo_tasa" value={formData.tipo_tasa} onChange={handleChange} className={selectClass} required>
                <option value="Efectiva">Efectiva (TEA)</option>
                <option value="Nominal">Nominal (TNA)</option>
              </select>
            </div>
            {formData.tipo_tasa === 'Nominal' && (
              <div>
                <label className={labelClass}>Capitalización *</label>
                <select name="capitalizacion" value={formData.capitalizacion} onChange={handleChange} className={selectClass} required>
                  {['Diaria', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Tasa de Descuento (%) *</label>
              <input type="number" name="tasa_descuento" value={formData.tasa_descuento} onChange={handleChange} className={inputClass} required step="0.0001" min="0.0001" />
            </div>
            <div>
              <label className={labelClass}>Frecuencia de Pago *</label>
              <select name="frecuencia_pago" value={formData.frecuencia_pago} onChange={handleChange} className={selectClass} required>
                <option value="Mensual">Mensual</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Semanal">Semanal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Plazo (meses) *</label>
              <input type="number" name="plazo_credito" value={formData.plazo_credito} onChange={handleChange} className={inputClass} required min="1" max={settings.plazoMaximo || '999'} />
              <p className={hintClass}>Máximo configurado: {settings.plazoMaximo} meses</p>
            </div>
            <div>
              <label className={labelClass}>Fecha de Inicio *</label>
              <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          {precioNum > 0 && (
            <div className="mx-5 mb-5 bg-brand-600 rounded-xl p-5 shadow-card">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Precio Vehículo</p>
                  <p className="font-bold text-white text-lg mt-1 tabular">{sym} {precioNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Monto Financiado</p>
                  <p className="font-bold text-white text-lg mt-1 tabular">{sym} {montoFinanciado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Cuota Balón</p>
                  <p className="font-bold text-white text-lg mt-1 tabular">{sym} {vrNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Seguros y Gastos Periódicos</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>% Seguro Desgravamen</label>
              <input type="number" name="pct_seguro_desgravamen" value={formData.pct_seguro_desgravamen} onChange={handleChange} className={inputClass} step="0.001" min="0" />
            </div>
            <div>
              <label className={labelClass}>Seguro de Riesgo</label>
              <input type="number" name="seguro_riesgo" value={formData.seguro_riesgo} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>GPS</label>
              <input type="number" name="gps" value={formData.gps} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Portes</label>
              <input type="number" name="portes" value={formData.portes} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Gastos de Administración</label>
              <input type="number" name="gastos_administrativos" value={formData.gastos_administrativos} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
          </div>
          <div className="mx-5 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">
              Se cobran cada período (incluso en gracia) y afectan el flujo del deudor
            </p>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Periodo de Gracia</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Períodos de Gracia Total</label>
              <input type="number" name="periodos_gracia_total" value={formData.periodos_gracia_total} onChange={handleChange} className={inputClass} min="0" max="99" />
              <p className={hintClass}>No paga cuota; el interés se capitaliza</p>
            </div>
            <div>
              <label className={labelClass}>Períodos de Gracia Parcial</label>
              <input type="number" name="periodos_gracia_parcial" value={formData.periodos_gracia_parcial} onChange={handleChange} className={inputClass} min="0" max="99" />
              <p className={hintClass}>Solo paga intereses; el saldo no cambia</p>
            </div>
          </div>
          <div className="mx-5 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">
              Se aplican en secuencia: primero los períodos de gracia Total, luego los de gracia Parcial,
              y el resto de cuotas son normales. Deja ambos en 0 para no usar gracia.
            </p>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Costes Iniciales Financiados</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Costes Notariales</label>
              <input type="number" name="costo_notarial" value={formData.costo_notarial} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Costes Registrales</label>
              <input type="number" name="costo_registral" value={formData.costo_registral} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Tasación</label>
              <input type="number" name="costo_tasacion" value={formData.costo_tasacion} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Comisión de Estudio</label>
              <input type="number" name="comision_estudio" value={formData.comision_estudio} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
            <div>
              <label className={labelClass}>Comisión de Activación</label>
              <input type="number" name="comision_activacion" value={formData.comision_activacion} onChange={handleChange} className={inputClass} step="0.01" min="0" />
            </div>
          </div>
          <div className="mx-5 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500">
              Gastos de una sola vez al formalizar el crédito.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => navigate(isEdit && id ? paths.solicitudDetalle(id) : paths.solicitudes)} className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 btn-grad text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : isEdit ? 'Guardar Cambios' : 'Registrar Solicitud de Crédito'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
