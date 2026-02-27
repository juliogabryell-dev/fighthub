'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Clear force_password_change flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', user.id);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/perfil');
      }, 2000);
    } catch {
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
            <span className="text-4xl mb-3 block">🔐</span>
            <h1 className="font-bebas text-3xl tracking-wider text-theme-text">
              TROCAR SENHA
            </h1>
            <p className="font-barlow text-theme-text/50 text-sm mt-1">
              Você precisa definir uma nova senha para continuar
            </p>
          </div>

          {/* Warning */}
          <div className="mb-6 p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
            <p className="font-barlow text-[#D4AF37] text-sm text-center">
              Sua senha foi resetada por um administrador. Defina uma nova senha.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="font-barlow text-green-400 text-sm text-center">
                  Senha alterada com sucesso! Redirecionando...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Nova Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />

              <InputField
                label="Confirmar Nova Senha"
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
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    SALVANDO...
                  </span>
                ) : (
                  'DEFINIR NOVA SENHA'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
