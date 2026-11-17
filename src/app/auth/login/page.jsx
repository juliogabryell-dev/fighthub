'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inactive, setInactive] = useState(false);

  // Redirected here by the middleware after the account was deactivated
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('inativo')) setInactive(true);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInactive(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Check if user needs to change password
      if (signInData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('force_password_change, status')
          .eq('id', signInData.user.id)
          .single();

        if (profile?.status === 'inactive') {
          await supabase.auth.signOut();
          setInactive(true);
          return;
        }

        if (profile?.force_password_change) {
          router.push('/auth/change-password');
          return;
        }
      }

      router.push('/perfil');
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-start justify-center px-4">
      <div className="max-w-md w-full mx-auto mt-32 mb-20">
        <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl p-8 border border-theme-border/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="FightLog" className="w-14 h-14 object-contain mx-auto mb-3" />
            <h1 className="font-bebas text-3xl tracking-wider text-theme-text">
              ENTRAR
            </h1>
            <p className="font-barlow text-theme-text/50 text-sm mt-1">
              Acesse sua conta
            </p>
          </div>

          {inactive && (
            <div className="mb-6 p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center">
              <p className="font-barlow-condensed uppercase tracking-wider text-sm font-semibold text-[#D4AF37]">
                Cadastro com pendência
              </p>
              <p className="font-barlow text-theme-text/70 text-sm mt-1">
                Seu cadastro está com alguma pendência e o acesso foi suspenso. Entre em contato com o nosso time para regularizar.
              </p>
              <Link
                href="/contato"
                className="inline-block mt-3 px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-barlow-condensed text-xs uppercase tracking-wider"
              >
                Falar com o time
              </Link>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="seu@email.com"
              required
            />

            <InputField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="text-right -mt-2">
              <Link
                href="/auth/forgot-password"
                className="font-barlow text-theme-text/40 text-xs hover:text-[#C41E3A] transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  ENTRANDO...
                </span>
              ) : (
                'ENTRAR'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 font-barlow text-theme-text/40 text-sm">
            Não tem conta?{' '}
            <Link
              href="/auth/register"
              className="text-[#C41E3A] hover:text-[#d42a46] font-semibold transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
