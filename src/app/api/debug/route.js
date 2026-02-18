import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks = {
    env_url: url ? `${url.substring(0, 20)}...` : 'NOT SET',
    env_key: key ? `${key.substring(0, 15)}...` : 'NOT SET',
    url_valid: url?.startsWith('http') || false,
  };

  if (!url || !key || !url.startsWith('http')) {
    return Response.json({ checks, error: 'ENV vars missing or invalid' });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('role', 'fighter')
      .eq('status', 'active');

    return Response.json({
      checks,
      supabase_error: error,
      fighters_count: data?.length || 0,
      fighters: data,
    });
  } catch (e) {
    return Response.json({ checks, catch_error: e.message });
  }
}
