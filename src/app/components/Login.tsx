import { useState } from 'react';
import { Eye, EyeOff, Car, ArrowRight, TrendingUp, ShieldCheck, Calculator } from 'lucide-react';

interface LoginProps {
  onLogin: (name: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usuario.trim() || !contrasena.trim()) {
      setError('Completa ambos campos para continuar.');
      return;
    }
    onLogin(usuario.trim());
  };

  return (
    <div className="min-h-screen bg-grad-brand animate-pan relative overflow-hidden flex items-center justify-center p-4">
      {/* Floating blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-fuchsia-400/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] bg-indigo-400/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-sky-300/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '6s' }} />

      {/* Floating glass chips (decor) */}
      <div className="hidden lg:flex items-center gap-2 absolute top-24 left-[14%] glass-dark rounded-2xl px-4 py-2.5 animate-floaty">
        <Calculator className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-semibold">Método Francés</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 absolute bottom-28 right-[14%] glass-dark rounded-2xl px-4 py-2.5 animate-floaty" style={{ animationDelay: '2s' }}>
        <TrendingUp className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-semibold">VAN · TIR · TCEA</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 absolute top-1/2 left-[8%] glass-dark rounded-2xl px-4 py-2.5 animate-floaty" style={{ animationDelay: '4s' }}>
        <ShieldCheck className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-semibold">Norma SBS</span>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md glass rounded-[32px] shadow-2xl p-8 sm:p-10 animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-grad-brand rounded-3xl flex items-center justify-center shadow-brand mb-4 animate-floaty">
            <Car className="w-8 h-8 text-white" strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Crédito<span className="text-grad">Auto</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Bienvenido de vuelta 👋</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="input-soft"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={mostrar ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="input-soft pr-11"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrar(!mostrar)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors"
              >
                {mostrar ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5">
              <p className="text-rose-600 text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-violet-600" />
              <span className="text-xs text-slate-500 font-medium">Recordarme</span>
            </label>
            <a className="text-xs text-violet-600 font-semibold hover:underline cursor-pointer">¿Olvidaste tu clave?</a>
          </div>

          <button
            type="submit"
            className="btn-grad w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            Iniciar sesión
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-7">
          Sistema de Crédito Vehicular · Lima, Perú 🇵🇪
        </p>
      </div>
    </div>
  );
}
