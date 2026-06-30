import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  type AppNotification,
} from '../lib/api/notifications';

const channelIcon = {
  in_app: Bell,
  email: Mail,
  sms: Smartphone,
} as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return new Date(iso).toLocaleDateString('es-PE');
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([getNotifications(25), getUnreadCount()]);
      setItems(list);
      setUnread(count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      setLoading(false);
      if (unread > 0) {
        await markAllNotificationsRead().catch(() => undefined);
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-2xl bg-slate-100/70 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-[18px] h-[18px] text-slate-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-up">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Notificaciones</p>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-slate-400 text-xs py-8">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">Sin notificaciones</p>
            ) : (
              items.map((n) => {
                const Icon = channelIcon[n.channel] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50/80 ${!n.read_at ? 'bg-violet-50/40' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                        ${n.channel === 'email' ? 'bg-sky-100 text-sky-600' : n.channel === 'sms' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
