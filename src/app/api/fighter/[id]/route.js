import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request, { params }) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, handle, avatar_url, bio, city, state, phone, whatsapp, height_cm, weight_kg, blood_type, instagram, facebook, youtube, tiktok, public_fields, birth_date, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*)')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Lutador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ fighter: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
