import { supabase } from '../supabase';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface AppNotification {
  id: number;
  channel: NotificationChannel;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  created_at: string;
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('No autenticado');
  return user.id;
}

export async function getNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, channel, title, body, category, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AppNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

export async function insertNotifications(
  items: Array<{
    channel: NotificationChannel;
    title: string;
    body: string;
    category?: string;
  }>
): Promise<void> {
  if (items.length === 0) return;
  const userId = await getUserId();
  const { error } = await supabase.from('notifications').insert(
    items.map((item) => ({
      user_id: userId,
      channel: item.channel,
      title: item.title,
      body: item.body,
      category: item.category ?? 'general',
    }))
  );
  if (error) throw error;
}
