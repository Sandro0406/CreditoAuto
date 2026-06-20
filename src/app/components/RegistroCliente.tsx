import { useState } from 'react';
import { Save, X } from 'lucide-react';
import Layout from './Layout';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface RegistroClienteProps {
  onBack: () => void;
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function RegistroCliente({ onBack, userName, currentPage, onNavigate, onLogout }: RegistroClienteProps) {
  const [formData, setFormData] = useState({
    id_cliente: '',
    nombre_cliente: '',
    dni_cliente: '',
    telefono_cliente: '',
    direccion_cliente: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    clientes.push({ ...formData, fecha_registro: new Date().toLocaleDateString('es-PE') });
    localStorage.setItem('clientes', JSON.stringify(clientes));
    alert('Cliente registrado exitosamente');
    onBack();
  };

  const inputClass = "input-soft";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <Layout
      currentPage={currentPage}
      userName={userName}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Clientes"
      pageSubtitle="Nuevo Cliente"
    >
      <div className="max-w-2xl mx-auto">
        <div className="card-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="font-semibold text-slate-800">Datos del Cliente</p>
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>ID Cliente <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="number" name="id_cliente" value={formData.id_cliente} onChange={handleChange}
                  className={inputClass} placeholder="Identificador único" required maxLength={10} />
                <p className="text-xs text-slate-400 mt-0.5">Entero | máx. 10 | Numérico</p>
              </div>

              <div>
                <label className={labelClass}>Nombre Completo <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="nombre_cliente" value={formData.nombre_cliente} onChange={handleChange}
                  className={inputClass} placeholder="Ej: Juan Pérez García" required maxLength={100} />
                <p className="text-xs text-slate-400 mt-0.5">Texto | máx. 100 | Alfabético</p>
              </div>

              <div>
                <label className={labelClass}>DNI <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="dni_cliente" value={formData.dni_cliente} onChange={handleChange}
                  className={inputClass} placeholder="12345678" required maxLength={8} pattern="[0-9]{8}" />
                <p className="text-xs text-slate-400 mt-0.5">Texto | 8 dígitos exactos</p>
              </div>

              <div>
                <label className={labelClass}>Teléfono <span className="text-red-500 normal-case font-normal">*</span></label>
                <input type="text" name="telefono_cliente" value={formData.telefono_cliente} onChange={handleChange}
                  className={inputClass} placeholder="987654321" required maxLength={9} pattern="[0-9]{9}" />
                <p className="text-xs text-slate-400 mt-0.5">Texto | 9 dígitos exactos</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>Dirección <span className="text-slate-400 normal-case font-normal">(Opcional)</span></label>
              <textarea name="direccion_cliente" value={formData.direccion_cliente} onChange={handleChange}
                className={inputClass} placeholder="Ej: Av. Los Olivos 123, Lima" maxLength={150} rows={3} />
              <p className="text-xs text-slate-400 mt-0.5">Texto | máx. 150 | Alfanumérico</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onBack}
                className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
