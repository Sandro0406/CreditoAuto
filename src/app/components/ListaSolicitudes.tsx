import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus, CreditCard, X, Eye, BarChart3 } from 'lucide-react';
import Layout from './Layout';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface Solicitud {
  id: string;
  cliente_id?: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  precio_vehiculo: string;
  cuota_inicial: string;
  monto_prestamo: string;
  tasa_interes: string;
  tipo_tasa: string;
  capitalizacion?: string;
  frecuencia_pago: string;
  plazo_credito: string;
  periodo_gracia: string;
  tipo_gracia: string;
  moneda: string;
  fecha_inicio: string;
  valor_residual: string;
  fecha_solicitud: string;
  estado: string;
}

interface Cliente {
  id_cliente: string;
  nombre_cliente: string;
}

interface ListaSolicitudesProps {
  onBack: () => void;
  onNuevaSolicitud: () => void;
  onEditarSolicitud: (s: Solicitud) => void;
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const estadoStyle: Record<string, string> = {
  Aprobado: 'bg-green-100 text-green-700',
  Pendiente: 'bg-amber-100 text-amber-700',
  Rechazado: 'bg-red-100 text-red-700',
};

const estadoOpciones = ['Pendiente', 'Aprobado', 'Rechazado'];

export default function ListaSolicitudes({ onBack, onNuevaSolicitud, onEditarSolicitud, userName, currentPage, onNavigate, onLogout }: ListaSolicitudesProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [editandoEstado, setEditandoEstado] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('solicitudes');
    if (saved) setSolicitudes(JSON.parse(saved));
    const cli = localStorage.getItem('clientes');
    if (cli) setClientes(JSON.parse(cli));
  }, []);

  const eliminar = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta solicitud?')) {
      const nuevas = solicitudes.filter(s => s.id !== id);
      setSolicitudes(nuevas);
      localStorage.setItem('solicitudes', JSON.stringify(nuevas));
    }
  };

  const abrirDetalle = (s: Solicitud) => {
    setSelected(s);
    setEditandoEstado(s.estado);
  };

  const guardarEstado = () => {
    if (!selected) return;
    const actualizadas = solicitudes.map(s => s.id === selected.id ? { ...s, estado: editandoEstado } : s);
    setSolicitudes(actualizadas);
    localStorage.setItem('solicitudes', JSON.stringify(actualizadas));
    setSelected(prev => prev ? { ...prev, estado: editandoEstado } : null);
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
    <Layout
      currentPage={currentPage}
      userName={userName}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Solicitudes de Crédito"
    >
      <div className="card-soft overflow-hidden">
        {/* Toolbar */}
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
              onClick={onNuevaSolicitud}
              className="btn-grad text-white px-4 py-2.5 rounded-2xl text-sm transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{busqueda ? 'No se encontraron solicitudes' : 'No hay solicitudes registradas'}</p>
            <button onClick={onNuevaSolicitud} className="mt-3 text-violet-600 hover:underline font-semibold text-sm">
              Crear primera solicitud
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Cliente', 'Vehículo', 'Monto', 'Plazo', 'Tasa', 'Moneda', 'Fecha', 'Estado', 'Acc.'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirDetalle(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEditarSolicitud(s)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setSelected(s); onNavigate('amortizacion'); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition" title="Ver amortización">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminar(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Eliminar">
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

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Detalle de Solicitud — {selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Cliente', nombreCliente(selected.cliente_id)],
                ['Marca / Modelo', `${selected.marca_vehiculo} ${selected.modelo_vehiculo}`],
                ['Precio Vehículo', `${sym(selected)} ${selected.precio_vehiculo}`],
                ['Cuota Inicial', `${sym(selected)} ${selected.cuota_inicial}`],
                ['Monto Financiado', `${sym(selected)} ${selected.monto_prestamo}`],
                ['Valor Residual', `${sym(selected)} ${selected.valor_residual}`],
                ['Tasa de Interés', `${selected.tasa_interes}% (${selected.tipo_tasa}${selected.tipo_tasa === 'Nominal' ? ' ' + selected.capitalizacion : ''})`],
                ['Frecuencia', selected.frecuencia_pago],
                ['Plazo', `${selected.plazo_credito} meses`],
                ['Periodo de Gracia', `${selected.periodo_gracia || 0} (${selected.tipo_gracia})`],
                ['Fecha Inicio', selected.fecha_inicio],
                ['Moneda', selected.moneda],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="font-medium text-slate-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Estado editable */}
            <div className="px-6 pb-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Estado de la Solicitud</p>
              <div className="flex gap-2">
                {estadoOpciones.map(op => (
                  <button
                    key={op}
                    onClick={() => setEditandoEstado(op)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition
                      ${editandoEstado === op
                        ? op === 'Aprobado' ? 'bg-green-500 border-green-500 text-white'
                          : op === 'Rechazado' ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-amber-500 border-amber-500 text-white'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5 pt-3 flex gap-2">
              <button
                onClick={guardarEstado}
                className="flex-1 btn-grad text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                Guardar estado
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2 border border-slate-200 rounded-2xl text-sm text-slate-700 hover:bg-slate-50 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
