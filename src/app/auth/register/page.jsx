'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/InputField';
import Icon from '@/components/Icon';
import Link from 'next/link';

const ROLES = [
  { key: 'fighter', label: 'Lutador', icon: 'swords', category: 'pessoa' },
  { key: 'coach', label: 'Treinador', icon: 'award', category: 'pessoa' },
  { key: 'referee', label: 'Árbitro', icon: 'shield', category: 'pessoa' },
  { key: 'match_maker', label: 'Match Maker', icon: 'link', category: 'pessoa' },
  { key: 'academy', label: 'Academia', icon: 'building', category: 'organizacao' },
  { key: 'team', label: 'Equipe', icon: 'users', category: 'organizacao' },
  { key: 'federation', label: 'Federação', icon: 'trophy', category: 'organizacao' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('fighter');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Entity-specific fields
  const [entityName, setEntityName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [nationality, setNationality] = useState('Brasileiro(a)');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [level, setLevel] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [foundingDate, setFoundingDate] = useState('');

  const isOrg = ['academy', 'team', 'federation'].includes(role);
  const isPerson = !isOrg;

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

    if (handle && !/^[a-z0-9_]{3,30}$/.test(handle)) {
      setError('O @ deve ter entre 3 e 30 caracteres (letras minúsculas, números e _ apenas).');
      setLoading(false);
      return;
    }

    if (role === 'match_maker' && !cpf) {
      setError('CPF é obrigatório para Match Maker.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const name = isOrg ? entityName : fullName;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role } },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data?.user;
      if (user) {
        // Create profile
        const profileData = {
          id: user.id,
          full_name: name,
          handle: handle || null,
          role,
          status: 'pending',
          is_fighter: role === 'fighter',
          is_coach: role === 'coach',
        };

        if (isPerson) {
          profileData.birth_date = birthDate || null;
          profileData.cpf = cpf || null;
          profileData.rg = rg || null;
        } else {
          profileData.birth_date = null;
          profileData.cpf_cnpj = cpfCnpj || null;
        }

        const { error: profileError } = await supabase.from('profiles').insert(profileData);

        if (profileError) {
          if (profileError.code === '23505' && profileError.message?.includes('handle')) {
            profileData.handle = null;
            await supabase.from('profiles').insert(profileData);
          } else if (profileError.code === '23503') {
            await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
          } else {
            const minimalProfile = { id: user.id, full_name: name, role, status: 'pending', is_fighter: role === 'fighter', is_coach: role === 'coach' };
            await supabase.from('profiles').upsert(minimalProfile, { onConflict: 'id' });
          }
        }

        // Create entity-specific record
        if (role === 'referee') {
          await supabase.from('referees').insert({
            owner_id: user.id,
            license_number: licenseNumber || null,
            level: level || null,
            nationality: nationality || null,
            status: 'pending',
          });
        } else if (role === 'team') {
          await supabase.from('teams').insert({
            owner_id: user.id,
            name: entityName,
            founding_date: foundingDate || null,
            status: 'pending',
          });
        } else if (role === 'match_maker') {
          await supabase.from('match_makers').insert({
            owner_id: user.id,
            cpf: cpf,
            nationality: nationality || null,
            specialty: specialty || null,
            status: 'pending',
          });
        } else if (role === 'federation') {
          await supabase.from('federations').insert({
            owner_id: user.id,
            official_name: entityName,
            abbreviation: abbreviation || null,
            cnpj: cpfCnpj || null,
            founding_date: foundingDate || null,
            status: 'pending',
          });
        }
      }

      setSuccess('Cadastro realizado! Aguarde aprovação do administrador.');
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-start justify-center px-4">
      <div className="max-w-lg w-full mx-auto mt-28 mb-20">
        <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl p-8 border border-theme-border/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="FightLog" className="w-14 h-14 object-contain mx-auto mb-3" />
            <h1 className="font-bebas text-3xl tracking-wider text-theme-text">CADASTRAR</h1>
            <p className="font-barlow text-theme-text/50 text-sm mt-1">Crie sua conta no FightLog</p>
          </div>

          {/* Role Selection - 2 rows */}
          <div className="mb-6">
            <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-theme-text/40 mb-2 font-semibold">Pessoa</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {ROLES.filter((r) => r.category === 'pessoa').map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 font-barlow-condensed uppercase tracking-wide text-[10px] font-semibold transition-all duration-300 ${
                    role === r.key
                      ? 'bg-[#C41E3A]/20 border-[#C41E3A] text-[#C41E3A]'
                      : 'bg-theme-text/5 border-theme-border/10 text-theme-text/50 hover:border-theme-border/20'
                  }`}
                >
                  <Icon name={r.icon} size={16} />
                  {r.label}
                </button>
              ))}
            </div>
            <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-theme-text/40 mb-2 font-semibold">Organização</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.filter((r) => r.category === 'organizacao').map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 font-barlow-condensed uppercase tracking-wide text-[10px] font-semibold transition-all duration-300 ${
                    role === r.key
                      ? 'bg-[#C41E3A]/20 border-[#C41E3A] text-[#C41E3A]'
                      : 'bg-theme-text/5 border-theme-border/10 text-theme-text/50 hover:border-theme-border/20'
                  }`}
                >
                  <Icon name={r.icon} size={16} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="font-barlow text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization fields */}
            {isOrg && (
              <>
                <InputField
                  label={role === 'academy' ? 'Nome da Academia' : role === 'team' ? 'Nome da Equipe' : 'Nome Oficial'}
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder={role === 'academy' ? 'Nome da sua academia' : role === 'team' ? 'Nome da equipe' : 'Nome oficial da federação'}
                  required
                />
                {role === 'federation' && (
                  <InputField label="Sigla" type="text" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="Ex: CBB, FBJ" />
                )}
                <InputField
                  label="CNPJ (opcional)"
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
                {(role === 'team' || role === 'federation') && (
                  <InputField label="Data de Fundação" type="date" value={foundingDate} onChange={(e) => setFoundingDate(e.target.value)} />
                )}
              </>
            )}

            {/* Person fields */}
            {isPerson && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Nome Completo" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" required />
                  <InputField label="Data de Nascimento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={role === 'match_maker' ? 'CPF (obrigatório)' : 'CPF (opcional)'}
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    required={role === 'match_maker'}
                  />
                  <InputField label="RG (opcional)" type="text" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="00.000.000-0" />
                </div>
                {(role === 'referee' || role === 'match_maker') && (
                  <InputField label="Nacionalidade" type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Brasileiro(a)" />
                )}
              </>
            )}

            {/* Referee-specific */}
            {role === 'referee' && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Nº Registro/Licença" type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Opcional" />
                <div>
                  <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/50 mb-1.5 font-semibold">Nível</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-3 text-theme-text font-barlow text-sm focus:outline-none focus:border-[#C41E3A]/50 transition-colors">
                    <option value="" className="bg-dark-card text-theme-text">Selecione</option>
                    <option value="regional" className="bg-dark-card text-theme-text">Regional</option>
                    <option value="nacional" className="bg-dark-card text-theme-text">Nacional</option>
                    <option value="internacional" className="bg-dark-card text-theme-text">Internacional</option>
                  </select>
                </div>
              </div>
            )}

            {/* Match Maker-specific */}
            {role === 'match_maker' && (
              <div>
                <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/50 mb-1.5 font-semibold">Especialidade</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-3 text-theme-text font-barlow text-sm focus:outline-none focus:border-[#C41E3A]/50 transition-colors">
                  <option value="" className="bg-dark-card text-theme-text">Selecione</option>
                  <option value="amador" className="bg-dark-card text-theme-text">Amador</option>
                  <option value="profissional" className="bg-dark-card text-theme-text">Profissional</option>
                  <option value="internacional" className="bg-dark-card text-theme-text">Internacional</option>
                </select>
              </div>
            )}

            {/* Common fields */}
            <div>
              <InputField label="@ Identificador (opcional)" type="text" value={handle} onChange={(e) => { setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); }} placeholder="seu_identificador" maxLength={30} />
              <p className="font-barlow text-theme-text/30 text-xs mt-1">Opcional. Letras minúsculas, números e _ (3 a 30 caracteres)</p>
            </div>

            <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} placeholder="seu@email.com" required />
            <InputField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />

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
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  CADASTRANDO...
                </span>
              ) : 'CADASTRAR'}
            </button>
          </form>

          <p className="text-center mt-6 font-barlow text-theme-text/40 text-sm">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-[#C41E3A] hover:text-[#C41E3A]/80 transition-colors font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
