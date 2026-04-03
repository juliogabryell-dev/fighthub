'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from './Icon';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/artes-marciais', label: 'Modalidades', icon: 'swords' },
  { href: '/lutadores', label: 'Lutadores', icon: 'users' },
  { href: '/treinadores', label: 'Treinadores', icon: 'shield' },
  {
    label: 'Entidades', icon: 'building',
    children: [
      { href: '/academias', label: 'Academias', icon: 'building' },
      { href: '/federacoes', label: 'Federações', icon: 'shield' },
      { href: '/equipes', label: 'Equipes', icon: 'users' },
      { href: '/match-makers', label: 'Match Makers', icon: 'link' },
      { href: '/arbitros', label: 'Árbitros', icon: 'award' },
    ],
  },
];

const ENTITY_PATHS = ['/academias', '/federacoes', '/equipes', '/match-makers', '/arbitros'];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [mobileEntitiesOpen, setMobileEntitiesOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, status, avatar_url, is_fighter, is_coach')
            .eq('id', session.user.id)
            .single();
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: profile?.full_name || session.user.email,
            role: profile?.role || 'user',
            is_fighter: profile?.is_fighter || false,
            is_coach: profile?.is_coach || false,
            avatar_url: profile?.avatar_url || null,
          });
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setEntitiesOpen(false);
      }
    }
    if (entitiesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [entitiesOpen]);

  async function handleLogout() {
    try {
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

  function isEntitiesActive() {
    return ENTITY_PATHS.some((p) => pathname.startsWith(p));
  }

  function getRoleLink(role) {
    if (['fighter', 'coach', 'academy', 'referee', 'team', 'match_maker', 'federation'].includes(role)) return '/perfil';
    return null;
  }

  const ROLE_LABELS = {
    fighter: 'Lutador', coach: 'Treinador', admin: 'Admin', academy: 'Academia',
    referee: 'Árbitro', team: 'Equipe', match_maker: 'Match Maker', federation: 'Federação',
  };

  function getRoleLabel() {
    if (user?.is_fighter && user?.is_coach) return 'Lutador & Treinador';
    return ROLE_LABELS[user?.role] || user?.role;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-brand-red/30" style={{ backgroundColor: 'var(--color-navbar-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="FightLog" className="w-9 h-9 rounded-lg object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-bebas text-xl tracking-wider">
                <span className="text-theme-text">FIGHT</span>
                <span className="text-brand-red">LOG</span>
              </span>
              <span className="text-[9px] text-brand-gold font-barlow-condensed uppercase tracking-[0.2em] -mt-0.5">
                O Portal da Luta
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                /* Entities Dropdown */
                <div key="entidades" className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setEntitiesOpen(!entitiesOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all duration-200 border ${
                      isEntitiesActive()
                        ? 'bg-brand-red/20 border-brand-red/40 text-brand-red'
                        : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-text/5 border-transparent'
                    }`}
                  >
                    <Icon name={link.icon} size={16} />
                    <span>{link.label}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className={`transition-transform duration-200 ${entitiesOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {entitiesOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-dark-card border border-theme-border/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl z-50">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setEntitiesOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-barlow-condensed uppercase tracking-wider transition-all ${
                            isActive(child.href)
                              ? 'bg-brand-red/15 text-brand-red'
                              : 'text-theme-text/60 hover:text-theme-text hover:bg-theme-text/5'
                          }`}
                        >
                          <Icon name={child.icon} size={16} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
                      : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-text/5 border border-transparent'
                  }`}
                >
                  <Icon name={link.icon} size={16} />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              )
            )}
          </div>

          {/* Auth Area */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {!user ? (
              <Link
                href="/auth/login"
                className="hidden md:flex items-center gap-2 bg-brand-red hover:bg-brand-red/80 text-white font-barlow-condensed uppercase text-sm tracking-wider px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Entrar
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {getRoleLink(user.role) ? (
                  <Link
                    href={getRoleLink(user.role)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-transparent hover:bg-theme-text/5 hover:border-theme-border/10 transition-all group"
                  >
                    <div className="relative">
                      <Avatar name={user.full_name} url={user.avatar_url} size={32} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-dark-card flex items-center justify-center border border-theme-border/10 group-hover:border-[#C41E3A]/40 transition-colors">
                        <Icon name="user" size={8} className="text-theme-text/50 group-hover:text-[#C41E3A] transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-sm text-theme-text font-barlow font-medium truncate max-w-[120px] group-hover:text-[#C41E3A] transition-colors">
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-theme-text/30 font-barlow-condensed uppercase tracking-wider group-hover:text-theme-text/50 transition-colors">
                        Meu Perfil
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 px-3 py-1.5">
                    <Avatar name={user.full_name} url={user.avatar_url} size={32} />
                    <div className="flex flex-col leading-none">
                      <span className="text-sm text-theme-text font-barlow font-medium truncate max-w-[120px]">
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-theme-text/30 font-barlow-condensed uppercase tracking-wider">
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="text-theme-text/40 hover:text-brand-red transition-colors ml-1"
                  title="Sair"
                >
                  <Icon name="logout" size={18} />
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-theme-text/60 hover:text-theme-text transition-colors"
            >
              <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-card/98 backdrop-blur-xl border-t border-theme-border/5">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key="entidades-mobile">
                  <button
                    onClick={() => setMobileEntitiesOpen(!mobileEntitiesOpen)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all ${
                      isEntitiesActive()
                        ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
                        : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-text/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={link.icon} size={18} />
                      {link.label}
                    </div>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className={`transition-transform duration-200 ${mobileEntitiesOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {mobileEntitiesOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-theme-border/10 pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => { setMobileMenuOpen(false); setMobileEntitiesOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all ${
                            isActive(child.href)
                              ? 'text-brand-red'
                              : 'text-theme-text/40 hover:text-theme-text'
                          }`}
                        >
                          <Icon name={child.icon} size={16} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider transition-all ${
                    isActive(link.href)
                      ? 'bg-brand-red/20 border border-brand-red/40 text-brand-red'
                      : 'text-theme-text/50 hover:text-theme-text hover:bg-theme-text/5 border border-transparent'
                  }`}
                >
                  <Icon name={link.icon} size={18} />
                  {link.label}
                </Link>
              )
            )}

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider text-theme-text/50">
              <ThemeToggle />
              <span>Alternar tema</span>
            </div>

            <div className="pt-2 mt-2 border-t border-theme-border/5">
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
                    <Avatar name={user.full_name} url={user.avatar_url} size={32} />
                    <div className="flex flex-col leading-none">
                      <span className="text-sm text-theme-text font-barlow font-medium">{user.full_name}</span>
                      <span className="text-[10px] text-theme-text/30 font-barlow-condensed uppercase tracking-wider">{getRoleLabel()}</span>
                    </div>
                  </div>
                  {getRoleLink(user.role) && (
                    <Link
                      href={getRoleLink(user.role)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider text-theme-text/50 hover:text-theme-text hover:bg-theme-text/5 transition-all"
                    >
                      <Icon name="user" size={18} />
                      Meu Perfil
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-barlow-condensed uppercase tracking-wider text-theme-text/50 hover:text-brand-red hover:bg-theme-text/5 transition-all w-full"
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
