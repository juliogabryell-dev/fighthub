import { createBrowserClient } from '@supabase/ssr';

let client = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith('http')) {
    // Return a mock client that won't crash but won't work either
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        getUser: async () => ({ data: { user: null } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase não configurado' } }),
        signUp: async () => ({ error: { message: 'Supabase não configurado' } }),
        signOut: async () => ({}),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: null }),
              order: () => ({ data: [] }),
            }),
            single: async () => ({ data: null }),
            order: () => ({ data: [] }),
          }),
          order: () => ({ data: [] }),
          single: async () => ({ data: null }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: { message: 'Supabase não configurado' } }),
        }),
      }),
    };
  }

  client = createBrowserClient(url, key);
  return client;
}
