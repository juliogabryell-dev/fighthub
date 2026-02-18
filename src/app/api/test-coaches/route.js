import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({ error: 'ENV vars missing', url: !!url, key: !!key });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, status, coach_experiences!coach_experiences_coach_id_fkey(*)')
      .eq('role', 'coach')
      .eq('status', 'active');

    return Response.json({ data, error, count: data?.length || 0 });
  } catch (e) {
    return Response.json({ catch_error: e.message });
  }
}
