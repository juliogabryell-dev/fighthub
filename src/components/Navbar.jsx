'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import Avatar from './Avatar';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/artes-marciais', label: 'Artes Marciais', icon: 'swords' },
  { href: '/lutadores', label: 'Lutadores', icon: 'users' },
  { href: '/treinadores', label: 'Treinadores', icon: 'shield' },
  { href: '/noticias', label: 'Notícias', icon: 'newspaper' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, status')
            .eq('id', session.user.id)
            .single();
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: profile?.full_name || session.user.email,
            role: profile?.role || 'user',
          });
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, [pathname]);

  async function handleLogout() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    } catch {
      setUser(null);
    }
  }

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function getRoleLink(role) {
    if (role === 'admin') return '/admin';
    if (role === 'fighter' || role === 'coach') return '/perfil';
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/95 backdrop-blur-xl border-b border-brand-red/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-red to-brand-red/70 flex items-center justify-center text-lg">
              ⚔️
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bebas text-xl tracking-wider">
                <span className="text-white">FIGHT</span>
                <span className="text-brand-red">HUB</span>
              </span>
              <span className="text-[9px] text-brand-gold font-barlow-condensed uppercase tracking-[0.2em] -mt-0.5">
                Portal de Artes Marciais
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon name={link.icon} size={16} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth Area */}
          <div className="flex items-center gap-3">
            {!user ? (
              <Link
                href="/auth/login"
                className="hidden md:flex items-center gap-2 bg-brand-red hover:bg-brand-red/80 text-white font-barlow-condensed uppercase text-sm tracking-wider px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Entrar
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar name={user.full_name} size={32} />
                  <div className="flex flex-col leading-none">
                    <span className="text-sm text-white font-barlow font-medium truncate max-w-[120px]">
                      {user.full_name}
                    </span>
                    <span className="text-[10px] text-white/30 font-barlow-condensed uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
                {getRoleLink(user.role) && (
                  <Link
                    href={getRoleLink(user.role)}
                    className="text-white/40 hover:text-white transition-colors"
                    title={user.role === 'admin' ? 'Painel Admin' : 'Meu Perfil'}
                  >
                    <Icon name={user.role === 'admin' ? 'settings' : 'user'} size={18} />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-brand-red transition-colors"
                  title="Sair"
                >
                  <Icon name="logout" size={18} />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white/60 hover:text-white transition-colors"
            >
              <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-card/98 backdrop-blur-xl border-t border-white/5">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all ${
                  isActive(link.href)
                    ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon name={link.icon} size={18} />
                {link.label}
              </Link>
            ))}

            {/* Mobile Auth */}
            <div className="pt-2 mt-2 border-t border-white/5">
              {!user ? (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red/80 text-white font-barlow-condensed uppercase text-sm tracking-wider px-4 py-2.5 rounded-lg transition-colors font-semibold w-full"
                >
                  Entrar
                </Link>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Avatar name={user.full_name} size={32} />
                    <div className="flex flex-col leading-none">
                      <span className="text-sm text-white font-barlow font-medium">
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-white/30 font-barlow-condensed uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  {getRoleLink(user.role) && (
                    <Link
                      href={getRoleLink(user.role)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Icon name={user.role === 'admin' ? 'settings' : 'user'} size={18} />
                      {user.role === 'admin' ? 'Painel Admin' : 'Meu Perfil'}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider text-white/50 hover:text-brand-red hover:bg-white/5 transition-all w-full"
                  >
                    <Icon name="logout" size={18} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
