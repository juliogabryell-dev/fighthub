import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, signAdminSession, verifyAdminSession } from '@/lib/adminSession';

// Best-effort brute-force protection (per server process): 5 failures / 15 min per IP+email
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function clientKey(request, email) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${ip}|${email}`;
}

function isBlocked(key) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { first: Date.now(), count: 1 });
  else entry.count += 1;
}

function sessionCookie(value, maxAge) {
  return {
    name: ADMIN_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

// POST: Log in — the password is checked here, on the server
export async function POST(request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const key = clientKey(request, normalizedEmail);
    if (isBlocked(key)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }, { status: 429 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey || !process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }
    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: admin, error } = await supabase.rpc('verify_admin_login', {
      p_email: normalizedEmail,
      p_password: password,
    });
    if (error || !admin?.id) {
      recordFailure(key);
      return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
    }

    failures.delete(key);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(await signAdminSession(admin), ADMIN_SESSION_MAX_AGE));
    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET: Verify admin session
export async function GET(request) {
  const admin = await verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    admin: { id: admin.id, name: admin.name, email: admin.email },
  });
}

// DELETE: Logout (clear cookie)
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie('', 0));
  return response;
}
