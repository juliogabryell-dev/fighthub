import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminSession';
import { isMembershipBlocked } from '@/lib/plans';

export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip middleware if Supabase is not configured
  if (!url || !key || !url.startsWith('http')) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected: /fulladmin (independent admin system — cookie-based)
  if (pathname.startsWith('/fulladmin') && !pathname.startsWith('/fulladmin/login')) {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/fulladmin/login';
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // Protected: /perfil
  if (pathname.startsWith('/perfil') && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && !BLOCK_EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from('profiles').select('status').eq('id', user.id).maybeSingle(),
      supabase
        .from('memberships')
        .select('status, grace_until, period_end, created_at')
        .eq('profile_id', user.id)
        .maybeSingle(),
    ]);

    // Account deactivated by the admin: end the session and explain on the login page
    if (profile?.status === 'inactive') {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.search = '?inativo=1';
      const res = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    }

    // Unpaid plan: 7 days of access after sign-up / expiry, then only the payment page
    if (isMembershipBlocked(membership)) {
      const payUrl = request.nextUrl.clone();
      payUrl.pathname = '/assinatura';
      payUrl.search = '';
      return NextResponse.redirect(payUrl);
    }
  }

  return supabaseResponse;
}

const BLOCK_EXEMPT = ['/assinatura', '/auth', '/api', '/termos', '/privacidade', '/contato'];

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
