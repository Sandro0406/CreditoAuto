import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Edit2, Trash2, Plus, CreditCard, Eye, BarChart3 } from 'lucide-react';
import Layout from './Layout';
import { getLoans, deleteLoan } from '../lib/api/loans';
import { getClients } from '../lib/api/clients';
import { paths } from '../lib/routes';
import type { Solicitud, Cliente } from '../lib/types';

const estadoStyle: Record<string, string> = {
  Aprobado: 'bg-green-100 text-green-700',
  Pendiente: 'bg-amber-100 text-amber-700',
  Rechazado: 'bg-red-100 text-red-700',
  Calculado: 'bg-indigo-100 text-indigo-700',
};

export default function ListaSolicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const [sols, cls] = await Promise.all([getLoans(), getClients()]);
      setSolicitudes(sols);
      setClientes(cls);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta solicitud?')) return;
    try {
      await deleteLoan(id);
      await cargar();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const nombreCliente = (clienteId?: string) => {
    if (!clienteId) return '—';
    const c = clientes.find(c => c.id_cliente === clienteId);
    return c ? c.nombre_cliente : clienteId;
  };

  const filtradas = solicitudes.filter(s =>
    s.marca_vehiculo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.modelo_vehiculo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.cliente_id && nombreCliente(s.cliente_id).toLowerCase().includes(busqueda.toLowerCase()))
  );

  const sym = (s: Solicitud) => s.moneda === 'Soles' ? 'S/' : '$';

  return (
    <Layout pageTitle="Solicitudes de Crédito">
      <div className="card-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <p className="font-semibold text-slate-800">Solicitudes</p>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{solicitudes.length}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por ID, vehículo o cliente…"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(paths.solicitudNueva)}
              className="btn-grad text-white px-4 py-2.5 rounded-2xl text-sm transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Cargando solicitudes…</div>
        ) : filtradas.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{busqueda ? 'No se encontraron solicitudes' : 'No hay solicitudes registradas'}</p>
            <button type="button" onClick={() => navigate(paths.solicitudNueva)} className="mt-3 text-violet-600 hover:underline font-semibold text-sm">
              Crear primera solicitud
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Cliente', 'Vehículo', 'Monto', 'Plazo', 'Tasa', 'Moneda', 'Fecha', 'Estado', 'Acc.'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(paths.solicitudDetalle(s.id))}
                  >
                    <td className="px-4 py-3 font-mono text-slate-600">{s.id}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{nombreCliente(s.cliente_id)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.marca_vehiculo} {s.modelo_vehiculo}</td>
                    <td className="px-4 py-3 text-slate-700">{sym(s)} {parseFloat(s.monto_prestamo || '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-slate-600">{s.plazo_credito} m</td>
                    <td className="px-4 py-3 text-slate-600">{s.tasa_interes}%</td>
                    <td className="px-4 py-3 text-slate-600">{s.moneda}</td>
                    <td className="px-4 py-3 text-slate-500">{s.fecha_solicitud}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoStyle[s.estado] || 'bg-slate-100 text-slate-600'}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => navigate(paths.solicitudDetalle(s.id))} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => navigate(paths.solicitudEditar(s.id))} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => navigate(paths.amortizacionSolicitud(s.id))} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Ver amortización">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => eliminar(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar">
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
    </Layout>
  );
}
