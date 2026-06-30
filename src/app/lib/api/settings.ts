import { supabase } from '../supabase';
import { AppConfig, DEFAULT_CONFIG } from '../types';

const SETTINGS_KEY = 'configuracion';

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('No autenticado');
  return user.id;
}

export async function getSettings(): Promise<AppConfig> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data?.value) return { ...DEFAULT_CONFIG };
  return { ...DEFAULT_CONFIG, ...(data.value as AppConfig) };
}

export async function saveSettings(config: AppConfig): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('app_settings').upsert(
    {
      user_id: userId,
      key: SETTINGS_KEY,
      value: config as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,key' }
  );
  if (error) throw error;
}
