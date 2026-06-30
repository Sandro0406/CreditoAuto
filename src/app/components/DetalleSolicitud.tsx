import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ArrowLeft, BarChart3, Car, CreditCard, Calendar, Percent,
  Edit2, User, Wallet, TrendingDown, CheckCircle2,
} from 'lucide-react';
import Layout from './Layout';
import { getLoanByExternalCode, updateLoanStatus } from '../lib/api/loans';
import { getClients } from '../lib/api/clients';
import { paths } from '../lib/routes';
import type { Cliente, Solicitud } from '../lib/types';

const estadoStyle: Record<string, string> = {
  Aprobado: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Pendiente: 'bg-amber-100 text-amber-700 ring-amber-200',
  Rechazado: 'bg-rose-100 text-rose-700 ring-rose-200',
  Calculado: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
};

const estadoOpciones = ['Pendiente', 'Aprobado', 'Rechazado'] as const;

function sym(s: Solicitud) {
  return s.moneda === 'Soles' ? 'S/' : '$';
}

function money(s: Solicitud, value: string | number | undefined) {
  const n = parseFloat(String(value ?? 0));
  return `${sym(s)} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export default function DetalleSolicitud() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editandoEstado, setEditandoEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([getLoanByExternalCode(id), getClients()])
      .then(([sol, cls]) => {
        if (!sol) {
          setError('No se encontró la solicitud.');
          return;
        }
        setSolicitud(sol);
        setEditandoEstado(sol.estado);
        setClientes(cls);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar solicitud');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const nombreCliente = (clienteId?: string) => {
    if (!clienteId) return '—';
    const c = clientes.find((x) => x.id_cliente === clienteId);
    return c ? c.nombre_cliente : clienteId;
  };

  const guardarEstado = async () => {
    if (!solicitud) return;
    setGuardando(true);
    try {
      await updateLoanStatus(solicitud.id, editandoEstado);
      setSolicitud({ ...solicitud, estado: editandoEstado });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <Layout pageTitle="Detalle de solicitud" pageSubtitle="Solicitudes">
        <div className="py-20 text-center text-slate-500 text-sm">Cargando…</div>
      </Layout>
    );
  }

  if (error || !solicitud) {
    return (
      <Layout pageTitle="Solicitud no encontrada" pageSubtitle="Solicitudes">
        <div className="card-soft p-8 text-center max-w-md mx-auto">
          <p className="text-slate-600 text-sm mb-4">{error || 'La solicitud no existe.'}</p>
          <Link to={paths.solicitudes} className="text-violet-600 font-semibold text-sm hover:underline">
            Volver a solicitudes
          </Link>
        </div>
      </Layout>
    );
  }

  const s = solicitud;

  return (
    <Layout
      pageTitle={`${s.marca_vehiculo} ${s.modelo_vehiculo}`}
      pageSubtitle={`Solicitudes / ${s.id}`}
    >
      <div className="max-w-4xl mx-auto space-y-5">
        <button
          type="button"
          onClick={() => navigate(paths.solicitudes)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a solicitudes
        </button>

        {/* Hero */}
        <div className="card-soft overflow-hidden">
          <div className="bg-grad-brand px-5 sm:px-6 py-5 sm:py-6 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-mono mb-1">{s.id}</p>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {s.marca_vehiculo} {s.modelo_vehiculo}
                  </h2>
                  <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {nombreCliente(s.cliente_id)}
                  </p>
                </div>
              </div>
              <span className={`self-start px-3 py-1 rounded-full text-xs font-bold ring-1 ${estadoStyle[s.estado] || 'bg-white/20 text-white ring-white/30'}`}>
                {s.estado}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {[
              { label: 'Precio vehículo', value: money(s, s.precio_vehiculo), icon: Car, color: 'text-violet-500' },
              { label: 'Cuota inicial', value: money(s, s.cuota_inicial), icon: Wallet, color: 'text-emerald-500' },
              { label: 'Monto financiado', value: money(s, s.monto_prestamo), icon: CreditCard, color: 'text-indigo-500' },
              { label: 'Valor residual', value: money(s, s.valor_residual), icon: TrendingDown, color: 'text-amber-500' },
            ].map((kpi) => (
              <div key={kpi.label} className="px-4 sm:px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                </div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Condiciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="card-soft p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-violet-500" />
              Condiciones financieras
            </h3>
            <dl className="space-y-3">
              {[
                ['Tasa de interés', `${s.tasa_interes}% ${s.tipo_tasa}${s.tipo_tasa === 'Nominal' && s.capitalizacion ? ` · ${s.capitalizacion}` : ''}`],
                ['Tasa de descuento', `${s.tasa_descuento}%`],
                ['Frecuencia de pago', s.frecuencia_pago],
                ['Plazo', `${s.plazo_credito} meses`],
                ['Moneda', s.moneda],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-3 text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-800 text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card-soft p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Plazos y gracia
            </h3>
            <dl className="space-y-3">
              {[
                ['Fecha de inicio', s.fecha_inicio],
                ['Fecha de solicitud', s.fecha_solicitud],
                ['Periodo de gracia', `${s.periodo_gracia || 0} periodos`],
                ['Tipo de gracia', s.tipo_gracia],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-3 text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-800 text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Estado */}
        <section className="card-soft p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Estado de la solicitud</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {estadoOpciones.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setEditandoEstado(op)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                  ${editandoEstado === op
                    ? op === 'Aprobado' ? 'bg-emerald-500 border-emerald-500 text-white shadow-money'
                      : op === 'Rechazado' ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-amber-500 border-amber-500 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                {op}
              </button>
            ))}
          </div>
          {editandoEstado !== s.estado && (
            <button
              type="button"
              onClick={guardarEstado}
              disabled={guardando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-grad text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {guardando ? 'Guardando…' : 'Guardar estado'}
            </button>
          )}
        </section>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate(paths.solicitudEditar(s.id))}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Edit2 className="w-4 h-4 text-emerald-500" />
            Editar solicitud
          </button>
          <button
            type="button"
            onClick={() => navigate(paths.amortizacionSolicitud(s.id))}
            className="flex-1 inline-flex items-center justify-center gap-2 btn-grad text-white py-3 rounded-2xl text-sm font-bold"
          >
            <BarChart3 className="w-4 h-4" />
            Ver amortización
          </button>
        </div>
      </div>
    </Layout>
  );
}
