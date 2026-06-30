import { supabase } from '../supabase';
import { usernameToEmail, ADVISOR_EMAIL } from '../types';

export async function signIn(username: string, password: string) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
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
