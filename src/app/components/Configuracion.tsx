import { useState, useEffect } from 'react';
import { Building2, DollarSign, Bell, Shield, Save, X, Percent } from 'lucide-react';
import Layout from './Layout';
import { getSettings, saveSettings } from '../lib/api/settings';
import { requestBrowserNotificationPermission } from '../lib/notify';
import { DEFAULT_CONFIG, type AppConfig } from '../lib/types';
import { useNavigate } from 'react-router';
import { paths } from '../lib/routes';
import { useAppSettings } from '../context/SettingsContext';

export default function Configuracion() {
  const navigate = useNavigate();
  const { refreshSettings } = useAppSettings();
  const [config, setConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setConfig)
      .catch(() => setConfig({ ...DEFAULT_CONFIG }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setConfig(prev => ({ ...prev, [name]: newValue }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await saveSettings(config);
      await refreshSettings();
      if (config.notificacionesEmail) {
        await requestBrowserNotificationPermission();
      }
      alert('Configuración guardada exitosamente');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "input-soft";
  const selectClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  const Toggle = ({ name, checked }: { name: keyof AppConfig; checked: boolean }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="sr-only peer" />
      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
    </label>
  );

  if (loading) {
    return (
      <Layout pageTitle="Configuración">
        <p className="text-slate-500 text-sm text-center py-16">Cargando configuración…</p>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Configuración">
      <div className="max-w-3xl mx-auto space-y-4">
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
            </div>
            <div>
              <label className={labelClass}>Tasa de Interés por Defecto (%)</label>
              <input type="number" name="tasaInteresDefecto" value={config.tasaInteresDefecto} onChange={handleChange} step="0.0001" className={inputClass} />
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
                  {['Diaria', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Plazo Máximo (meses)</label>
              <input type="number" name="plazoMaximo" value={config.plazoMaximo} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto Máximo de Crédito</label>
              <input type="number" name="montoMaximo" value={config.montoMaximo} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="mx-5 mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <Percent className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Valores iniciales para nuevas solicitudes. Plazo y monto máximo se validan al registrar.
              Las notificaciones aparecen en la campana del header (email/SMS se registran como canal adicional).
            </p>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-slate-800 text-sm">Notificaciones</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: 'notificacionesEmail' as const, label: 'Notificaciones por Email', desc: 'Alertas por correo', checked: config.notificacionesEmail },
              { name: 'notificacionesSMS' as const, label: 'Notificaciones por SMS', desc: 'Alertas por SMS', checked: config.notificacionesSMS },
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

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <p className="font-semibold text-slate-800 text-sm">Políticas de Aprobación</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Auto-aprobación hasta (monto)</label>
              <input type="number" name="autoaprobacionHasta" value={config.autoaprobacionHasta} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">Requiere Aprobación de Gerencia</p>
                <p className="text-xs text-slate-500">Para montos superiores al límite</p>
              </div>
              <Toggle name="requiereAprobacionGerencia" checked={config.requiereAprobacionGerencia} />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => navigate(paths.dashboard)} className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={handleGuardar} disabled={saving}
            className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
