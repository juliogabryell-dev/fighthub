import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

// ============================================================
// SERVER-SIDE: Obter usuário autenticado + perfil
// ============================================================

/**
 * Retorna o usuário autenticado atual e seu perfil da tabela profiles.
 * Deve ser chamado apenas em Server Components, Server Actions ou Route Handlers.
 *
 * @returns {{ user: object | null, profile: object | null }}
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { user, profile: null };
  }

  return { user, profile };
}

// ============================================================
// CLIENT-SIDE: Helpers de autenticação
// ============================================================

/**
 * Registra um novo usuário com email e senha.
 * Os metadados (full_name, role, etc.) são passados como `metadata`
 * e ficam disponíveis em auth.users.raw_user_meta_data.
 *
 * @param {string} email
 * @param {string} password
 * @param {object} metadata - Ex: { full_name, birth_date, role }
 * @returns {{ data: object | null, error: object | null }}
 */
export async function signUp(email, password, metadata = {}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
}

/**
 * Faz login com email e senha.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ data: object | null, error: object | null }}
 */
export async function signIn(email, password) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Faz logout do usuário atual.
 *
 * @returns {{ error: object | null }}
 */
export async function signOut() {
  const supabase = createBrowserClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}
