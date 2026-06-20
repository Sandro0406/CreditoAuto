import { useState, useEffect } from 'react';
import { Building2, DollarSign, Bell, Shield, Save, X, Percent } from 'lucide-react';
import Layout from './Layout';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface ConfiguracionProps {
  onBack: () => void;
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Configuracion({ onBack, userName, currentPage, onNavigate, onLogout }: ConfiguracionProps) {
  const [config, setConfig] = useState({
    nombreEmpresa: 'CréditoAuto',
    // Parámetros financieros por defecto
    monedaDefecto: 'Soles',
    tasaInteresDefecto: '12.5',
    tipoTasaDefecto: 'Efectiva',
    capitalizacionDefecto: 'Mensual',
    plazoMaximo: '120',
    montoMaximo: '500000',
    // Notificaciones
    notificacionesEmail: true,
    notificacionesSMS: false,
    // Políticas
    autoaprobacionHasta: '50000',
    requiereAprobacionGerencia: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('configuracion');
    if (saved) setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setConfig(prev => ({ ...prev, [name]: newValue }));
  };

  const handleGuardar = () => {
    localStorage.setItem('configuracion', JSON.stringify(config));
    alert('Configuración guardada exitosamente');
  };

  const inputClass = "input-soft";
  const selectClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  const Toggle = ({ name, checked }: { name: string; checked: boolean }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="sr-only peer" />
      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
    </label>
  );

  return (
    <Layout
      currentPage={currentPage}
      userName={userName}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Configuración"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Company info */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-800 text-sm">Información de la Empresa</p>
          </div>
          <div className="p-5">
            <label className={labelClass}>Nombre de la Empresa</label>
            <input type="text" name="nombreEmpresa" value={config.nombreEmpresa} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* Financial parameters */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <p className="font-semibold text-slate-800 text-sm">Parámetros Financieros por Defecto</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Moneda por Defecto</label>
              <select name="monedaDefecto" value={config.monedaDefecto} onChange={handleChange} className={selectClass}>
                <option value="Soles">Soles (S/)</option>
                <option value="Dólares">Dólares ($)</option>
              </select>
              <p className="text-xs text-slate-400 mt-0.5">Se usará al crear nuevas solicitudes</p>
            </div>
            <div>
              <label className={labelClass}>Tasa de Interés por Defecto (%)</label>
              <input type="number" name="tasaInteresDefecto" value={config.tasaInteresDefecto} onChange={handleChange}
                step="0.0001" min="0" className={inputClass} />
              <p className="text-xs text-slate-400 mt-0.5">Pre-rellena el campo en nuevas solicitudes</p>
            </div>
            <div>
              <label className={labelClass}>Tipo de Tasa por Defecto</label>
              <select name="tipoTasaDefecto" value={config.tipoTasaDefecto} onChange={handleChange} className={selectClass}>
                <option value="Efectiva">Efectiva (TEA)</option>
                <option value="Nominal">Nominal (TNA)</option>
              </select>
            </div>
            {config.tipoTasaDefecto === 'Nominal' && (
              <div>
                <label className={labelClass}>Capitalización por Defecto</label>
                <select name="capitalizacionDefecto" value={config.capitalizacionDefecto} onChange={handleChange} className={selectClass}>
                  <option value="Diaria">Diaria</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Bimestral">Bimestral</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Plazo Máximo (meses)</label>
              <input type="number" name="plazoMaximo" value={config.plazoMaximo} onChange={handleChange}
                min="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto Máximo de Crédito</label>
              <input type="number" name="montoMaximo" value={config.montoMaximo} onChange={handleChange}
                min="0" step="1000" className={inputClass} />
            </div>
          </div>

          <div className="mx-5 mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <Percent className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Los valores de moneda, tipo de tasa y tasa de interés se usan como valores iniciales al crear nuevas solicitudes de crédito. Pueden modificarse en cada solicitud.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-slate-800 text-sm">Notificaciones</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: 'notificacionesEmail', label: 'Notificaciones por Email', desc: 'Enviar alertas por correo electrónico', checked: config.notificacionesEmail },
              { name: 'notificacionesSMS', label: 'Notificaciones por SMS', desc: 'Enviar alertas por mensaje de texto', checked: config.notificacionesSMS },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle name={item.name} checked={item.checked} />
              </div>
            ))}
          </div>
        </div>

        {/* Approval policies */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <p className="font-semibold text-slate-800 text-sm">Políticas de Aprobación</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Auto-aprobación hasta (monto)</label>
              <input type="number" name="autoaprobacionHasta" value={config.autoaprobacionHasta} onChange={handleChange}
                min="0" step="1000" className={inputClass} />
              <p className="text-xs text-slate-400 mt-0.5">Créditos menores a este monto se aprueban automáticamente</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">Requiere Aprobación de Gerencia</p>
                <p className="text-xs text-slate-500">Para montos superiores al límite de auto-aprobación</p>
              </div>
              <Toggle name="requiereAprobacionGerencia" checked={config.requiereAprobacionGerencia} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button onClick={handleGuardar}
            className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </Layout>
  );
}
