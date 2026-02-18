import { createClient } from '@supabase/supabase-js';

/**
 * Client público para leituras server-side (sem cookies/sessão).
 * Arquivo separado para evitar importar next/headers.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  return createClient(url, key);
}
