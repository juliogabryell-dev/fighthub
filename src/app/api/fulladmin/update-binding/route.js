import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { table, binding_id, new_status } = await request.json();

    if (!table || !binding_id || !new_status) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const ALLOWED_TABLES = ['fighter_coaches', 'fighter_academies', 'team_fighters', 'federation_referees', 'federation_teams', 'match_maker_athletes', 'match_maker_teams', 'match_maker_federations'];
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Tabela inválida' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabaseAdmin
      .from(table)
      .update({ status: new_status })
      .eq('id', binding_id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
