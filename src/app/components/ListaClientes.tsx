import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Edit, Trash2, Plus, Users, Save, X } from 'lucide-react';
import Layout from './Layout';
import { getClients, updateClient, deleteClient } from '../lib/api/clients';
import { paths } from '../lib/routes';
import type { Cliente } from '../lib/types';

const inputClass = "input-soft";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

export default function ListaClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setClientes(await getClients());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminarCliente = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      await deleteClient(id);
      await cargar();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const abrirEdicion = (cliente: Cliente) => {
    setEditando(cliente);
    setEditForm({ ...cliente });
  };

  const cerrarEdicion = () => {
    setEditando(null);
    setEditForm(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => prev ? { ...prev, [name]: value } : null);
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await updateClient(editForm);
      await cargar();
      cerrarEdicion();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const filtrados = clientes.filter(c =>
    c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.dni_cliente.includes(busqueda) ||
    c.telefono_cliente.includes(busqueda)
  );

  return (
    <Layout pageTitle="Clientes">
      <div className="card-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Users className="w-5 h-5 text-teal-500" />
            <p className="font-semibold text-slate-800">Lista de Clientes</p>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{clientes.length}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI o teléfono…"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <button type="button" onClick={() => navigate(paths.clienteNuevo)}
              className="btn-grad text-white px-4 py-2.5 rounded-2xl text-sm transition flex items-center gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        {error && <p className="px-5 py-3 text-rose-600 text-sm">{error}</p>}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Cargando clientes…</div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
            <button type="button" onClick={() => navigate(paths.clienteNuevo)} className="mt-3 text-violet-600 hover:underline font-semibold text-sm">
              Registrar primer cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Nombre', 'DNI', 'Teléfono', 'Dirección', 'Fecha Registro', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((cliente) => (
                  <tr key={cliente.id_cliente} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600">{cliente.id_cliente}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cliente.nombre_cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{cliente.dni_cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{cliente.telefono_cliente}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{cliente.direccion_cliente || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{cliente.fecha_registro}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEdicion(cliente)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarCliente(cliente.id_cliente)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && editForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={cerrarEdicion}>
          <div className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base pr-4">Editar Cliente — ID {editando.id_cliente}</h3>
              <button onClick={cerrarEdicion} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarEdicion} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre Completo <span className="text-red-500">*</span></label>
                  <input type="text" name="nombre_cliente" value={editForm.nombre_cliente} onChange={handleEditChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>DNI <span className="text-red-500">*</span></label>
                  <input type="text" name="dni_cliente" value={editForm.dni_cliente} onChange={handleEditChange} className={inputClass} required pattern="[0-9]{8}" />
                </div>
                <div>
                  <label className={labelClass}>Teléfono <span className="text-red-500">*</span></label>
                  <input type="text" name="telefono_cliente" value={editForm.telefono_cliente} onChange={handleEditChange} className={inputClass} required pattern="[0-9]{9}" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <textarea name="direccion_cliente" value={editForm.direccion_cliente} onChange={handleEditChange} className={inputClass} rows={2} />
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={cerrarEdicion} className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 btn-grad text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
