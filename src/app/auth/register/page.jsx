'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';
import Icon from '@/components/Icon';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('fighter');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data?.user;
      if (user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: fullName,
          birth_date: birthDate,
          cpf,
          rg,
          role,
          status: 'pending',
        });

        if (profileError) {
          setError(profileError.message);
          return;
        }
      }

      setSuccess('Cadastro realizado! Aguarde aprovação do administrador.');
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-start justify-center px-4">
      <div className="max-w-lg w-full mx-auto mt-28 mb-20">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">⚔️</span>
            <h1 className="font-bebas text-3xl tracking-wider text-white">
              CADASTRAR
            </h1>
            <p className="font-barlow text-white/50 text-sm mt-1">
              Crie sua conta no FightHub
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('fighter')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-barlow-condensed uppercase tracking-wide text-sm font-semibold transition-all duration-300 ${
                role === 'fighter'
                  ? 'bg-[#C41E3A]/20 border-[#C41E3A] text-[#C41E3A]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              <Icon name="swords" size={18} />
              Lutador
            </button>
            <button
              type="button"
              onClick={() => setRole('coach')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-barlow-condensed uppercase tracking-wide text-sm font-semibold transition-all duration-300 ${
                role === 'coach'
                  ? 'bg-[#C41E3A]/20 border-[#C41E3A] text-[#C41E3A]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              <Icon name="award" size={18} />
              Treinador
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="font-barlow text-green-400 text-sm text-center">
                {success}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Nome Completo"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
              <InputField
                label="Data de Nascimento"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="CPF (opcional)"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
              <InputField
                label="RG (opcional)"
                type="text"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />

            <InputField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />

            {/* Warning Box */}
            <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
              <p className="font-barlow text-[#D4AF37] text-sm text-center">
                Seu cadastro passará por aprovação do administrador antes de ser ativado.
              </p>
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
                  CADASTRANDO...
                </span>
              ) : (
                'CADASTRAR'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 font-barlow text-white/40 text-sm">
            Já tem conta?{' '}
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
