import { supabase } from '../supabase';
import { usernameToEmail, ADVISOR_EMAIL } from '../types';

export async function signIn(username: string, password: string) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Registro abierto de un nuevo asesor. Acepta usuario o email (usernameToEmail
 * lo resuelve). Devuelve si quedó una sesión activa o si falta confirmar email.
 */
export async function signUp(
  username: string,
  password: string
): Promise<{ session: unknown; needsConfirmation: boolean }> {
  const email = usernameToEmail(username);
  const cleanUsername = username.trim().toLowerCase().split('@')[0];

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: cleanUsername, role: 'asesor' } },
  });
  if (error) throw error;

  // Best-effort: asegurar la fila en public.users (por si no hay trigger).
  // Solo funciona si signUp ya devolvió sesión; si falla lo ignoramos.
  if (data.user && data.session) {
    await supabase
      .from('users')
      .upsert({ id: data.user.id, username: cleanUsername, role: 'asesor' });
  }

  if (data.session) {
    return { session: data.session, needsConfirmation: false };
  }

  // Sin sesión: puede que la confirmación de email esté desactivada y podamos
  // iniciar sesión directamente; si no, hay que confirmar el correo.
  const signInRes = await supabase.auth.signInWithPassword({ email, password });
  if (!signInRes.error && signInRes.data.session) {
    return { session: signInRes.data.session, needsConfirmation: false };
  }
  return { session: null, needsConfirmation: true };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getProfileUsername(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  return data?.username ?? user.email?.split('@')[0] ?? null;
}

/** Seed asesor on first run if env allows (dev only) */
export async function ensureAdvisorSeed(password = '123456') {
  const { error } = await supabase.auth.signInWithPassword({
    email: ADVISOR_EMAIL,
    password,
  });
  if (!error) {
    await supabase.auth.signOut();
    return;
  }

  await supabase.auth.signUp({
    email: ADVISOR_EMAIL,
    password,
    options: {
      data: { username: 'asesor', role: 'asesor' },
    },
  });
}
