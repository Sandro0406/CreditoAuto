import { getSettings } from './api/settings';
import { insertNotifications } from './api/notifications';
import type { AppConfig } from './types';

async function dispatch(
  settings: AppConfig,
  event: { title: string; body: string; category: string }
): Promise<void> {
  const items: Array<{ channel: 'in_app' | 'email' | 'sms'; title: string; body: string; category: string }> = [
    { channel: 'in_app', ...event },
  ];

  if (settings.notificacionesEmail) {
    items.push({
      channel: 'email',
      title: `[Email] ${event.title}`,
      body: `Se registraría envío por correo: ${event.body}`,
      category: event.category,
    });
  }

  if (settings.notificacionesSMS) {
    items.push({
      channel: 'sms',
      title: `[SMS] ${event.title}`,
      body: `Se registraría envío por SMS: ${event.body}`,
      category: event.category,
    });
  }

  await insertNotifications(items);

  if (settings.notificacionesEmail && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(event.title, { body: event.body });
    }
  }
}

async function withSettings(
  event: { title: string; body: string; category: string },
  settings?: AppConfig
): Promise<void> {
  const cfg = settings ?? await getSettings();
  await dispatch(cfg, event);
}

export async function notifyClientCreated(clientName: string, settings?: AppConfig): Promise<void> {
  await withSettings(
    {
      title: 'Cliente registrado',
      body: `${clientName} fue agregado correctamente.`,
      category: 'cliente',
    },
    settings
  );
}

export async function notifyLoanCreated(
  externalCode: string,
  vehicle: string,
  status: string,
  statusMessage: string,
  settings?: AppConfig
): Promise<void> {
  await withSettings(
    {
      title: `Solicitud ${externalCode}`,
      body: `${vehicle} — Estado: ${status}. ${statusMessage}`,
      category: 'solicitud',
    },
    settings
  );
}

export async function notifyLoanStatusChanged(
  externalCode: string,
  vehicle: string,
  newStatus: string,
  settings?: AppConfig
): Promise<void> {
  await withSettings(
    {
      title: `Estado actualizado — ${externalCode}`,
      body: `${vehicle} ahora está en estado ${newStatus}.`,
      category: 'estado',
    },
    settings
  );
}

export async function requestBrowserNotificationPermission(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}
