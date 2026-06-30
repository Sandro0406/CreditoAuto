import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Save, X } from 'lucide-react';
import Layout from './Layout';
import { createClient } from '../lib/api/clients';
import { supabase } from '../lib/supabase';
import { paths } from '../lib/routes';

export default function RegistroCliente() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    dni_cliente: '',
    telefono_cliente: '',
    direccion_cliente: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      await createClient(user.id, formData);
      alert('Cliente registrado exitosamente');
      navigate(paths.clientes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <Layout pageTitle="Clientes" pageSubtitle="Nuevo Cliente">
      <div className="max-w-2xl mx-auto">
        <div className="card-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="font-semibold text-slate-800">Datos del Cliente</p>
            <button type="button" onClick={() => navigate(paths.clientes)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 text-rose-600 text-xs">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nombre Completo <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="nombre_cliente" value={formData.nombre_cliente} onChange={handleChange}
                  className={inputClass} placeholder="Ej: Juan Pérez García" required maxLength={100} />
              </div>

              <div>
                <label className={labelClass}>DNI <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="dni_cliente" value={formData.dni_cliente} onChange={handleChange}
                  className={inputClass} placeholder="12345678" required maxLength={8} pattern="[0-9]{8}" />
              </div>

              <div>
                <label className={labelClass}>Teléfono <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="telefono_cliente" value={formData.telefono_cliente} onChange={handleChange}
                  className={inputClass} placeholder="987654321" required maxLength={9} pattern="[0-9]{9}" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Dirección <span className="text-slate-400 normal-case font-normal">(Opcional)</span></label>
              <textarea name="direccion_cliente" value={formData.direccion_cliente} onChange={handleChange}
                className={inputClass} placeholder="Ej: Av. Los Olivos 123, Lima" maxLength={150} rows={3} />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => navigate(paths.clientes)}
                className="flex-1 py-3 sm:py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? 'Guardando…' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
