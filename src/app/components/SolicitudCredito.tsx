import { useState, useEffect } from 'react';
import { Car, CreditCard, Clock, Save, X, User } from 'lucide-react';
import Layout from './Layout';
import { calcularMontoPrestamo, toNumber } from '../lib/financialCalculations';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface SolicitudCreditoProps {
  onBack: () => void;
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  solicitudEditar?: any;
}

interface Cliente {
  id_cliente: string;
  nombre_cliente: string;
  dni_cliente: string;
}

export default function SolicitudCredito({ onBack, userName, currentPage, onNavigate, onLogout, solicitudEditar }: SolicitudCreditoProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const defaultsFromConfig = () => {
    const cfg = JSON.parse(localStorage.getItem('configuracion') || '{}');
    return {
      moneda: cfg.monedaDefecto || 'Soles',
      tasa_interes: cfg.tasaInteresDefecto || '',
      tipo_tasa: cfg.tipoTasaDefecto || 'Efectiva',
      capitalizacion: cfg.capitalizacionDefecto || 'Mensual',
    };
  };

  const [formData, setFormData] = useState(() => {
    if (solicitudEditar) {
      return { ...solicitudEditar };
    }
    const defs = defaultsFromConfig();
    return {
      cliente_id: '',
      marca_vehiculo: '',
      modelo_vehiculo: '',
      precio_vehiculo: '',
      cuota_inicial: '',
      tasa_descuento: '',
      tasa_interes: defs.tasa_interes,
      tipo_tasa: defs.tipo_tasa,
      capitalizacion: defs.capitalizacion,
      frecuencia_pago: 'Mensual',
      plazo_credito: '',
      periodo_gracia: '0',
      tipo_gracia: 'Ninguno',
      moneda: defs.moneda,
      fecha_inicio: new Date().toISOString().split('T')[0],
      valor_residual: '0',
    };
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const precioVehiculo = toNumber(formData.precio_vehiculo);
    const cuotaInicial = toNumber(formData.cuota_inicial);
    const valorResidual = toNumber(formData.valor_residual);

    if (cuotaInicial >= precioVehiculo) {
      alert('La cuota inicial debe ser menor al precio del vehículo.');
      return;
    }
    if (valorResidual >= precioVehiculo - cuotaInicial) {
      alert('El valor residual (cuota balón) debe ser menor al monto a financiar (Precio − Cuota Inicial).');
      return;
    }

    const montoPrestamo = calcularMontoPrestamo(precioVehiculo, cuotaInicial);
    const solicitudes = JSON.parse(localStorage.getItem('solicitudes') || '[]');

    if (solicitudEditar) {
      const idx = solicitudes.findIndex((s: any) => s.id === solicitudEditar.id);
      if (idx !== -1) {
        solicitudes[idx] = {
          ...formData,
          id: solicitudEditar.id,
          monto_prestamo: montoPrestamo.toFixed(2),
          fecha_solicitud: solicitudEditar.fecha_solicitud,
          estado: solicitudEditar.estado,
        };
      }
      localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
      alert('Solicitud actualizada exitosamente');
    } else {
      solicitudes.push({
        id: `SOL-${Date.now()}`,
        ...formData,
        monto_prestamo: montoPrestamo.toFixed(2),
        fecha_solicitud: new Date().toLocaleDateString('es-PE'),
        estado: 'Pendiente',
      });
      localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
      alert('Solicitud de crédito registrada exitosamente');
    }

    onBack();
  };

  const inputClass = "input-soft";
  const selectClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const hintClass = "text-xs text-slate-400 mt-0.5";

  const precioNum = toNumber(formData.precio_vehiculo);
  const cuotaInicialNum = toNumber(formData.cuota_inicial);
  const vrNum = toNumber(formData.valor_residual);
  const montoFinanciado = Math.max(precioNum - cuotaInicialNum, 0);
  const sym = formData.moneda === 'Soles' ? 'S/' : '$';

  return (
    <Layout
      currentPage={currentPage}
      userName={userName}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Solicitudes"
      pageSubtitle={solicitudEditar ? 'Editar Solicitud' : 'Nueva Solicitud'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">

        {/* Client selector */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" />
            <p className="font-semibold text-slate-700 text-sm">Cliente</p>
          </div>
          <div className="p-5">
            <div>
              <label className={labelClass}>Cliente Asociado</label>
              <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} className={selectClass}>
                <option value="">— Sin cliente asociado —</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre_cliente} — DNI: {c.dni_cliente}
                  </option>
                ))}
              </select>
              <p className={hintClass}>
                {clientes.length === 0
                  ? 'No hay clientes registrados. Puedes registrar uno en la sección Clientes.'
                  : 'Selecciona el cliente para esta solicitud de crédito.'}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle data */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-500" />
            <p className="font-semibold text-slate-700 text-sm">Datos del Vehículo</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Marca <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="text" name="marca_vehiculo" value={formData.marca_vehiculo} onChange={handleChange}
                className={inputClass} placeholder="Ej: Toyota" required maxLength={50} />
              <p className={hintClass}>Texto | máx. 50</p>
            </div>
            <div>
              <label className={labelClass}>Modelo <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="text" name="modelo_vehiculo" value={formData.modelo_vehiculo} onChange={handleChange}
                className={inputClass} placeholder="Ej: Corolla 2024" required maxLength={50} />
              <p className={hintClass}>Texto | máx. 50</p>
            </div>
            <div>
              <label className={labelClass}>Precio Total <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="number" name="precio_vehiculo" value={formData.precio_vehiculo} onChange={handleChange}
                className={inputClass} placeholder="45000.00" required step="0.01" min="0.01" />
              <p className={hintClass}>Decimal | Monetario</p>
            </div>
          </div>
        </div>

        {/* Credit data */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <p className="font-semibold text-slate-700 text-sm">Condiciones del Crédito</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Moneda <span className="text-red-500 normal-case font-normal">*</span></label>
              <select name="moneda" value={formData.moneda} onChange={handleChange} className={selectClass} required>
                <option value="Soles">Soles (S/)</option>
                <option value="Dólares">Dólares ($)</option>
              </select>
              <p className={hintClass}>Soles o Dólares</p>
            </div>
            <div>
              <label className={labelClass}>Cuota Inicial <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleChange}
                className={inputClass} placeholder="10000.00" required step="0.01" min="0" />
              <p className={hintClass}>Mayor o igual a 0</p>
            </div>
            <div>
              <label className={labelClass}>Valor Residual / Cuota Balón</label>
              <input type="number" name="valor_residual" value={formData.valor_residual} onChange={handleChange}
                className={inputClass} placeholder="0.00" step="0.01" min="0" />
              <p className={hintClass}>Compra Inteligente — pago diferido al final</p>
            </div>
            <div>
              <label className={labelClass}>Tasa de Interés (%) <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="number" name="tasa_interes" value={formData.tasa_interes} onChange={handleChange}
                className={inputClass} placeholder="12.50" required step="0.0001" min="0.0001" />
              <p className={hintClass}>Decimal | Porcentaje</p>
            </div>
            <div>
              <label className={labelClass}>Tipo de Tasa <span className="text-red-500 normal-case font-normal">*</span></label>
              <select name="tipo_tasa" value={formData.tipo_tasa} onChange={handleChange} className={selectClass} required>
                <option value="Efectiva">Efectiva (TEA)</option>
                <option value="Nominal">Nominal (TNA)</option>
              </select>
              <p className={hintClass}>Defecto: Efectiva</p>
            </div>
            {formData.tipo_tasa === 'Nominal' && (
              <div>
                <label className={labelClass}>Capitalización <span className="text-red-500 normal-case font-normal">*</span></label>
                <select name="capitalizacion" value={formData.capitalizacion} onChange={handleChange} className={selectClass} required>
                  <option value="Diaria">Diaria</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Bimestral">Bimestral</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
                <p className={hintClass}>Necesario para convertir TNA → TEA</p>
              </div>
            )}
            <div>
              <label className={labelClass}>Tasa de Descuento (%) <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="number" name="tasa_descuento" value={formData.tasa_descuento} onChange={handleChange}
                className={inputClass} placeholder="10.00" required step="0.0001" min="0.0001" />
              <p className={hintClass}>Para cálculo del VAN del deudor</p>
            </div>
            <div>
              <label className={labelClass}>Frecuencia de Pago <span className="text-red-500 normal-case font-normal">*</span></label>
              <select name="frecuencia_pago" value={formData.frecuencia_pago} onChange={handleChange} className={selectClass} required>
                <option value="Mensual">Mensual</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Semanal">Semanal</option>
              </select>
              <p className={hintClass}>Defecto: Mensual</p>
            </div>
            <div>
              <label className={labelClass}>Plazo (meses) <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="number" name="plazo_credito" value={formData.plazo_credito} onChange={handleChange}
                className={inputClass} placeholder="48" required min="1" max="999" />
              <p className={hintClass}>Entero | Mayor a 0</p>
            </div>
            <div>
              <label className={labelClass}>Fecha de Inicio <span className="text-red-500 normal-case font-normal">*</span></label>
              <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange}
                className={inputClass} required />
              <p className={hintClass}>Fecha del primer período</p>
            </div>
          </div>

          {/* Preview card */}
          {precioNum > 0 && (
            <div className="mx-5 mb-5 bg-grad-brand animate-pan rounded-3xl p-5 relative overflow-hidden shadow-brand">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
              <div className="relative grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Precio Vehículo</p>
                  <p className="font-extrabold text-white text-lg mt-1">{sym} {precioNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Monto Financiado</p>
                  <p className="font-extrabold text-white text-lg mt-1">{sym} {montoFinanciado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Cuota Balón (al vencer)</p>
                  <p className="font-extrabold text-white text-lg mt-1">{sym} {vrNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grace period */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-slate-700 text-sm">Periodo de Gracia</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de Gracia <span className="text-red-500 normal-case font-normal">*</span></label>
              <select name="tipo_gracia" value={formData.tipo_gracia} onChange={handleChange} className={selectClass} required>
                <option value="Ninguno">Ninguno</option>
                <option value="Total">Total — no paga nada, interés se capitaliza</option>
                <option value="Parcial">Parcial — solo paga intereses</option>
              </select>
              <p className={hintClass}>Defecto: Ninguno</p>
            </div>
            {formData.tipo_gracia !== 'Ninguno' && (
              <div>
                <label className={labelClass}>N° de Periodos de Gracia <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="number" name="periodo_gracia" value={formData.periodo_gracia} onChange={handleChange}
                  className={inputClass} placeholder="0" required min="1" max="99" />
                <p className={hintClass}>Entero | ≥ 1</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {solicitudEditar ? 'Guardar Cambios' : 'Registrar Solicitud de Crédito'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
