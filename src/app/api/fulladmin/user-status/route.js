import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminSession';
import { getServiceClient } from '@/lib/mercadopago';

// POST { user_id, status: 'inactive' | 'active' } — deactivates / reactivates an account.
// An inactive account can't log in to the portal (login page and middleware).
export async function POST(request) {
  const admin = await verifyAdminSession(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { user_id, status } = await request.json().catch(() => ({}));
  if (!user_id || !['inactive', 'active'].includes(status)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });

  const { error } = await supabase.from('profiles').update({ status }).eq('id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
