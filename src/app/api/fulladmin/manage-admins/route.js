import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET: List all admin users
export async function GET(request) {
  try {
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar admins: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ admins: data || [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: Create a new admin user
export async function POST(request) {
  try {
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    // Use the RPC function to create admin (handles password hashing)
    const { data, error } = await supabaseAdmin.rpc('create_admin_user', {
      p_email: email.toLowerCase(),
      p_password: password,
      p_name: name,
    });

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json({ error: 'Já existe um admin com este email' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Erro ao criar admin: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, admin_id: data });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE: Delete an admin user
export async function DELETE(request) {
  try {
    const adminCookie = request.cookies.get('admin_session')?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { admin_id } = await request.json();

    if (!admin_id) {
      return NextResponse.json({ error: 'ID do admin não informado' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    // Check how many admins exist - don't allow deleting the last one
    const { count } = await supabaseAdmin
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (count <= 1) {
      return NextResponse.json({ error: 'Não é possível excluir o último administrador' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', admin_id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir admin: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
