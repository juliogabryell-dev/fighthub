import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { admin_id, new_password } = await request.json();

    if (!admin_id || !new_password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Use RPC to update password with pgcrypto hashing
    const { error } = await supabaseAdmin.rpc('update_admin_password', {
      p_admin_id: admin_id,
      p_new_password: new_password,
    });

    if (error) {
      return NextResponse.json({ error: 'Erro ao redefinir senha: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
