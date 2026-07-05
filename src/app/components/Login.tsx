import { useState } from 'react';
import { Eye, EyeOff, Car, ArrowRight, TrendingUp, ShieldCheck, Calculator } from 'lucide-react';
import { signIn, signUp, getProfileUsername } from '../lib/api/auth';

interface LoginProps {
  onLogin: (name: string) => void;
}

const features = [
  { icon: Calculator, title: 'Método Francés', desc: 'Cuotas constantes con cronograma detallado.' },
  { icon: TrendingUp, title: 'VAN · TIR · TCEA', desc: 'Indicadores de rentabilidad y costo real.' },
  { icon: ShieldCheck, title: 'Norma SBS', desc: 'Cálculo según Res. 8181-2012.' },
];

export default function Login({ onLogin }: LoginProps) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [loading, setLoading] = useState(false);

  const esRegistro = modo === 'registro';

  const cambiarModo = (nuevo: 'login' | 'registro') => {
    setModo(nuevo);
    setError('');
    setAviso('');
    setConfirmar('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!usuario.trim() || !contrasena.trim()) {
      setError('Completa ambos campos para continuar.');
      return;
    }
    if (esRegistro) {
      if (contrasena.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (contrasena !== confirmar) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }
    setLoading(true);
    try {
      if (esRegistro) {
        const { needsConfirmation } = await signUp(usuario.trim(), contrasena);
        if (needsConfirmation) {
          setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
          cambiarModo('login');
          return;
        }
        const name = await getProfileUsername();
        onLogin(name || usuario.trim());
      } else {
        await signIn(usuario.trim(), contrasena);
        const name = await getProfileUsername();
        onLogin(name || usuario.trim());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      if (msg.includes('Invalid login')) {
        setError('Usuario o contraseña incorrectos.');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Ese usuario ya está registrado. Inicia sesión.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Panel de marca (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-bold text-lg tracking-tight">CréditoAuto</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl xl:text-[34px] font-bold leading-tight tracking-tight">
            Crédito vehicular con transparencia financiera
          </h2>
          <p className="text-white/70 mt-4 text-[15px] leading-relaxed">
            Registra clientes, simula créditos y genera cronogramas de amortización con indicadores auditables.
          </p>

          <div className="mt-10 space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-[13px] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© {new Date().getFullYear()} CréditoAuto · Compra Inteligente</p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">CréditoAuto</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-7">
            {esRegistro
              ? 'Registra un nuevo asesor para acceder a la plataforma.'
              : 'Ingresa tus credenciales para continuar.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="input-soft"
                placeholder="example@mail.com"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="input-soft pr-11"
                  placeholder="••••••••"
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setMostrar(!mostrar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                  aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrar ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {esRegistro && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar contraseña</label>
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="input-soft"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            {aviso && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                <p className="text-emerald-700 text-xs font-medium">{aviso}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-grad w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
            >
              {loading
                ? (esRegistro ? 'Creando…' : 'Ingresando…')
                : (esRegistro ? 'Crear cuenta' : 'Iniciar sesión')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => cambiarModo(esRegistro ? 'login' : 'registro')}
              className="font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              {esRegistro ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
