import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST: Reset a user's password (admin action)
export async function POST(request) {
  try {
    // Verify admin session cookie exists
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { user_id } = await request.json();
    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a temporary password
    const tempPassword = 'trocar' + Math.random().toString(36).slice(2, 8);

    // Update user's password via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: tempPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao resetar senha: ' + updateError.message }, { status: 500 });
    }

    // Set force_password_change flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ force_password_change: true })
      .eq('id', user_id);

    if (profileError) {
      return NextResponse.json({ error: 'Senha resetada mas erro ao marcar flag: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, temp_password: tempPassword });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
