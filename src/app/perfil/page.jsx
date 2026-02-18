'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/Modal';
import InputField from '@/components/InputField';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import Link from 'next/link';

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', birth_date: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Fighter-specific
  const [martialArts, setMartialArts] = useState([]);
  const [fightRecords, setFightRecords] = useState([]);
  const [showAddArt, setShowAddArt] = useState(false);
  const [artForm, setArtForm] = useState({
    art_name: '',
    level: '',
    started_at: '',
    description: '',
  });

  // Coach-specific
  const [experiences, setExperiences] = useState([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expForm, setExpForm] = useState({
    title: '',
    organization: '',
    period_start: '',
    period_end: '',
    description: '',
  });

  useEffect(() => {
    fetchUserAndProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUserAndProfile() {
    setLoading(true);
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    setProfile(profileData);

    if (profileData?.role === 'fighter') {
      const { data: arts } = await supabase
        .from('fighter_martial_arts')
        .select('*')
        .eq('fighter_id', currentUser.id)
        .order('created_at', { ascending: false });
      setMartialArts(arts || []);

      const { data: records } = await supabase
        .from('fight_records')
        .select('*')
        .eq('fighter_id', currentUser.id);
      setFightRecords(records || []);
    }

    if (profileData?.role === 'coach') {
      const { data: exps } = await supabase
        .from('coach_experiences')
        .select('*')
        .eq('coach_id', currentUser.id)
        .order('period_start', { ascending: false });
      setExperiences(exps || []);
    }

    setLoading(false);
  }

  async function handleAddMartialArt(e) {
    e.preventDefault();
    const { error } = await supabase.from('fighter_martial_arts').insert({
      fighter_id: user.id,
      art_name: artForm.art_name,
      level: artForm.level,
      started_at: artForm.started_at,
      description: artForm.description,
    });

    if (!error) {
      setShowAddArt(false);
      setArtForm({ art_name: '', level: '', started_at: '', description: '' });
      fetchUserAndProfile();
    }
  }

  function openAddExp() {
    setEditingExpId(null);
    setExpForm({ title: '', organization: '', period_start: '', period_end: '', description: '' });
    setShowExpModal(true);
  }

  function openEditExp(exp) {
    setEditingExpId(exp.id);
    setExpForm({
      title: exp.title || '',
      organization: exp.organization || '',
      period_start: exp.period_start || '',
      period_end: exp.period_end || '',
      description: exp.description || '',
    });
    setShowExpModal(true);
  }

  async function handleSaveExperience(e) {
    e.preventDefault();
    const payload = {
      title: expForm.title,
      organization: expForm.organization,
      period_start: expForm.period_start,
      period_end: expForm.period_end || null,
      description: expForm.description,
    };

    let error;
    if (editingExpId) {
      ({ error } = await supabase
        .from('coach_experiences')
        .update(payload)
        .eq('id', editingExpId));
    } else {
      ({ error } = await supabase
        .from('coach_experiences')
        .insert({ ...payload, coach_id: user.id }));
    }

    if (!error) {
      setShowExpModal(false);
      fetchUserAndProfile();
    }
  }

  async function handleDeleteExperience(expId) {
    if (!confirm('Tem certeza que deseja excluir esta experiência?')) return;
    const { error } = await supabase
      .from('coach_experiences')
      .delete()
      .eq('id', expId);
    if (!error) fetchUserAndProfile();
  }

  function openEditProfile() {
    setEditForm({
      full_name: profile?.full_name || '',
      birth_date: profile?.birth_date || '',
    });
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
    setShowEditProfile(true);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleEditProfile(e) {
    e.preventDefault();
    setSaving(true);

    try {
      let avatar_url = profile?.avatar_url || null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          alert('Erro ao enviar foto: ' + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatar_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          birth_date: editForm.birth_date || null,
          avatar_url,
        })
        .eq('id', user.id);

      if (error) {
        alert('Erro ao salvar perfil: ' + error.message);
      } else {
        setShowEditProfile(false);
        fetchUserAndProfile();
      }
    } catch (err) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function getStatusBadge(status) {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels = {
      active: 'Ativo',
      pending: 'Pendente',
      rejected: 'Rejeitado',
    };
    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border ${
          styles[status] || styles.pending
        }`}
      >
        {labels[status] || status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <svg
          className="animate-spin h-10 w-10 text-[#C41E3A]"
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
      </div>
    );
  }

  const isFighter = profile?.role === 'fighter';
  const isCoach = profile?.role === 'coach';
  const wins = fightRecords.reduce((sum, r) => sum + (r.wins || 0), 0);
  const losses = fightRecords.reduce((sum, r) => sum + (r.losses || 0), 0);
  const draws = fightRecords.reduce((sum, r) => sum + (r.draws || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl tracking-wider text-white">
            MEU{' '}
            <span className={isFighter ? 'text-[#C41E3A]' : 'text-[#D4AF37]'}>
              PERFIL
            </span>
          </h1>
          <button
            onClick={openEditProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow text-sm"
          >
            <Icon name="settings" size={16} />
            Editar Perfil
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-8">
          {/* Card Header with gradient */}
          <div
            className={`relative p-6 ${
              isCoach
                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5'
                : 'bg-gradient-to-r from-[#C41E3A]/20 to-[#C41E3A]/5'
            }`}
          >
            <div className="flex items-center gap-5">
              <Avatar
                name={profile?.full_name}
                url={profile?.avatar_url}
                size={80}
                className="border-2 border-white/20"
              />
              <div>
                <h2 className="font-bebas text-3xl tracking-wide text-white">
                  {profile?.full_name}
                </h2>
                <p className="font-barlow-condensed text-sm uppercase tracking-wider text-white/60 mt-1">
                  {isFighter ? '🥊 Lutador' : '🏅 Treinador'}
                </p>
                <div className="mt-2">{getStatusBadge(profile?.status)}</div>
              </div>
            </div>
          </div>

          {/* Fighter Record Summary */}
          {isFighter && (
            <div className="p-6 border-t border-white/5">
              <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mb-3">
                Cartel
              </p>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="font-bebas text-2xl text-green-400">
                    {wins}
                  </p>
                  <p className="font-barlow-condensed text-xs uppercase tracking-wider text-green-400/60">
                    V
                  </p>
                </div>
                <div className="flex-1 text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="font-bebas text-2xl text-red-400">
                    {losses}
                  </p>
                  <p className="font-barlow-condensed text-xs uppercase tracking-wider text-red-400/60">
                    D
                  </p>
                </div>
                <div className="flex-1 text-center p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <p className="font-bebas text-2xl text-[#D4AF37]">
                    {draws}
                  </p>
                  <p className="font-barlow-condensed text-xs uppercase tracking-wider text-[#D4AF37]/60">
                    E
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fighter: Martial Arts List */}
        {isFighter && martialArts.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              ARTES MARCIAIS
            </h3>
            <div className="space-y-3">
              {martialArts.map((art) => (
                <div
                  key={art.id}
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-barlow-condensed text-white font-semibold">
                        {art.art_name}
                      </p>
                      <p className="font-barlow text-white/40 text-sm">
                        {art.level}
                        {art.started_at && ` · Desde ${art.started_at}`}
                      </p>
                    </div>
                  </div>
                  {art.description && (
                    <p className="font-barlow text-white/30 text-sm mt-2">
                      {art.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fighter: Action Cards */}
        {isFighter && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setShowAddArt(true)}
              className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 hover:border-[#C41E3A]/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3 group-hover:bg-[#C41E3A]/30 transition-colors">
                <Icon name="plus" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Adicionar Arte Marcial
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                Registre suas modalidades
              </p>
            </button>

            <div className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 opacity-60 cursor-not-allowed text-left">
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3">
                <Icon name="video" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Adicionar Vídeo
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                Fase 2 - Em breve
              </p>
            </div>

            <Link
              href="/lutadores"
              className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 hover:border-[#C41E3A]/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3 group-hover:bg-[#C41E3A]/30 transition-colors">
                <Icon name="swords" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Desafiar Lutador
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                Encontre oponentes para lutar
              </p>
            </Link>

            <div className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 opacity-60 cursor-not-allowed text-left">
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3">
                <Icon name="users" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Gerenciar Treinadores
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                Vincule-se a treinadores
              </p>
            </div>
          </div>
        )}

        {/* Coach: Experiences */}
        {isCoach && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bebas text-xl tracking-wider text-white/80">
                MINHAS EXPERIÊNCIAS
              </h3>
              <button
                onClick={openAddExp}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
              >
                <Icon name="plus" size={14} />
                Adicionar
              </button>
            </div>

            {experiences.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-[#D4AF37]/20 space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#D4AF37]/30 border-2 border-[#D4AF37]" />

                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-barlow-condensed text-white font-semibold uppercase tracking-wider">
                            {exp.title}
                          </h4>
                          <p className="font-barlow text-[#D4AF37] text-sm mt-1">
                            {exp.organization}
                          </p>
                          <p className="font-barlow text-white/40 text-xs mt-1">
                            {exp.period_start}
                            {exp.period_end ? ` - ${exp.period_end}` : ' - Atual'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditExp(exp)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
                            title="Editar"
                          >
                            <Icon name="settings" size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Excluir"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="font-barlow text-white/30 text-sm mt-3">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-8 border border-white/10 text-center">
                <p className="font-barlow text-white/30">
                  Nenhuma experiência cadastrada ainda.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Martial Art Modal (Fighter) */}
      {showAddArt && (
        <Modal onClose={() => setShowAddArt(false)} title="Adicionar Arte Marcial">
          <form onSubmit={handleAddMartialArt} className="space-y-4">
            <InputField
              label="Nome da Arte Marcial"
              type="text"
              value={artForm.art_name}
              onChange={(e) => setArtForm({ ...artForm, art_name: e.target.value })}
              placeholder="Ex: Muay Thai, Jiu-Jitsu, Boxe"
              required
            />
            <InputField
              label="Nível"
              type="text"
              value={artForm.level}
              onChange={(e) => setArtForm({ ...artForm, level: e.target.value })}
              placeholder="Ex: Iniciante, Intermediário, Avançado"
              required
            />
            <InputField
              label="Data de Início"
              type="date"
              value={artForm.started_at}
              onChange={(e) =>
                setArtForm({ ...artForm, started_at: e.target.value })
              }
            />
            <div>
              <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-white/50 mb-2">
                Descrição
              </label>
              <textarea
                value={artForm.description}
                onChange={(e) =>
                  setArtForm({ ...artForm, description: e.target.value })
                }
                rows={3}
                placeholder="Conte um pouco sobre sua experiência..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-barlow text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C41E3A]/50 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all"
            >
              SALVAR
            </button>
          </form>
        </Modal>
      )}

      {/* Add/Edit Experience Modal (Coach) */}
      {showExpModal && (
        <Modal onClose={() => setShowExpModal(false)} title={editingExpId ? 'Editar Experiência' : 'Adicionar Experiência'}>
          <form onSubmit={handleSaveExperience} className="space-y-4">
            <InputField
              label="Título"
              type="text"
              value={expForm.title}
              onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              placeholder="Ex: Treinador Principal"
              required
            />
            <InputField
              label="Organização"
              type="text"
              value={expForm.organization}
              onChange={(e) =>
                setExpForm({ ...expForm, organization: e.target.value })
              }
              placeholder="Ex: Team Alpha"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Início"
                type="date"
                value={expForm.period_start}
                onChange={(e) =>
                  setExpForm({ ...expForm, period_start: e.target.value })
                }
                required
              />
              <InputField
                label="Fim"
                type="date"
                value={expForm.period_end}
                onChange={(e) =>
                  setExpForm({ ...expForm, period_end: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-white/50 mb-2">
                Descrição
              </label>
              <textarea
                value={expForm.description}
                onChange={(e) =>
                  setExpForm({ ...expForm, description: e.target.value })
                }
                rows={3}
                placeholder="Descreva suas atividades e conquistas..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-barlow text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#b8962e] text-black font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#e0bd45] hover:to-[#c4a035] transition-all"
            >
              SALVAR
            </button>
          </form>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <Modal onClose={() => setShowEditProfile(false)} title="Editar Perfil">
          <form onSubmit={handleEditProfile} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <Avatar name={editForm.full_name} size={96} />
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="camera" size={24} className="text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-white/40 hover:text-white/60 font-barlow-condensed uppercase tracking-wider transition-colors"
              >
                Alterar foto
              </button>
            </div>

            <InputField
              label="Nome Completo"
              type="text"
              value={editForm.full_name}
              onChange={(e) =>
                setEditForm({ ...editForm, full_name: e.target.value })
              }
              placeholder="Seu nome completo"
              required
            />
            <InputField
              label="Data de Nascimento"
              type="date"
              value={editForm.birth_date}
              onChange={(e) =>
                setEditForm({ ...editForm, birth_date: e.target.value })
              }
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50"
            >
              {saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
