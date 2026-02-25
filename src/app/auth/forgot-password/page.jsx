'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-start justify-center px-4">
      <div className="max-w-md w-full mx-auto mt-32 mb-20">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🔑</span>
            <h1 className="font-bebas text-3xl tracking-wider text-white">
              RECUPERAR SENHA
            </h1>
            <p className="font-barlow text-white/50 text-sm mt-1">
              Enviaremos um link para redefinir sua senha
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
                  Email enviado com sucesso! Verifique sua caixa de entrada (e spam) para o link de recuperacao.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white/60 font-barlow-condensed uppercase tracking-widest text-sm font-semibold text-center hover:bg-white/10 transition-all"
              >
                VOLTAR AO LOGIN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
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
                    ENVIANDO...
                  </span>
                ) : (
                  'ENVIAR LINK DE RECUPERACAO'
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <p className="text-center mt-6 font-barlow text-white/40 text-sm">
            Lembrou a senha?{' '}
            <Link
              href="/auth/login"
              className="text-[#C41E3A] hover:text-[#d42a46] font-semibold transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
