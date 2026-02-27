'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      // The user arrives here after /auth/callback has already exchanged the
      // code/token and set the session cookies. We just need to confirm
      // there is an active session.

      // Also handle the legacy case where Supabase appends tokens as a hash
      // fragment (#access_token=...) — the client SDK picks those up automatically.

      // 1. Listen for PASSWORD_RECOVERY event (hash fragment flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
          setInitializing(false);
        }
      });

      const params = new URLSearchParams(window.location.search);

      // 2. Handle token_hash + type directly in URL (Supabase email template format)
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      if (tokenHash && type === 'recovery') {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (!otpError) {
          setReady(true);
          setInitializing(false);
          subscription.unsubscribe();
          return;
        }
      }

      // 3. Check for ?code= in URL (direct PKCE — fallback if someone lands here with a code)
      const code = params.get('code');
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!codeError) {
          setReady(true);
          setInitializing(false);
          subscription.unsubscribe();
          return;
        }
      }

      // 4. Check existing session (set by /auth/callback server route)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      }

      setInitializing(false);

      return () => subscription.unsubscribe();
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <svg
          className="animate-spin h-10 w-10 text-[#C41E3A]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-start justify-center px-4">
      <div className="max-w-md w-full mx-auto mt-32 mb-20">
        <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl p-8 border border-theme-border/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🔒</span>
            <h1 className="font-bebas text-3xl tracking-wider text-theme-text">
              NOVA SENHA
            </h1>
            <p className="font-barlow text-theme-text/50 text-sm mt-1">
              Digite sua nova senha
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="font-barlow text-green-400 text-sm text-center">
                  Senha alterada com sucesso! Redirecionando para o login...
                </p>
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3 rounded-lg bg-theme-text/5 border border-theme-border/10 text-theme-text/60 font-barlow-condensed uppercase tracking-widest text-sm font-semibold text-center hover:bg-theme-text/10 transition-all"
              >
                IR PARA O LOGIN
              </Link>
            </div>
          ) : !ready ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                <p className="font-barlow text-[#D4AF37] text-sm text-center">
                  Link invalido ou expirado. Solicite um novo link de recuperacao.
                </p>
              </div>
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold text-center hover:from-[#d42a46] hover:to-[#b82040] transition-all"
              >
                SOLICITAR NOVO LINK
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Nova Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                required
              />

              <InputField
                label="Confirmar Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
              />

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
                    SALVANDO...
                  </span>
                ) : (
                  'REDEFINIR SENHA'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
