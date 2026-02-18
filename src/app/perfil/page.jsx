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
  const [editForm, setEditForm] = useState({
    full_name: '',
    birth_date: '',
    phone: '',
    city: '',
    state: '',
    bio: '',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Fighter-specific
  const [martialArts, setMartialArts] = useState([]);
  const [fightRecords, setFightRecords] = useState([]);
  const [showArtModal, setShowArtModal] = useState(false);
  const [editingArtId, setEditingArtId] = useState(null);
  const [artForm, setArtForm] = useState({
    art_name: '',
    level: '',
    started_at: '',
    description: '',
  });

  // Videos (Fighter)
  const [videos, setVideos] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [videoForm, setVideoForm] = useState({
    youtube_url: '',
    title: '',
    modality: '',
    fight_date: '',
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

  // Challenges (Fighter)
  const [challenges, setChallenges] = useState([]);
  const [showChallengesSection, setShowChallengesSection] = useState(false);

  // Result reporting
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultChallenge, setResultChallenge] = useState(null);
  const [resultSaving, setResultSaving] = useState(false);

  // Coach management (Fighter)
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [myCoaches, setMyCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Binding requests (Coach)
  const [bindingRequests, setBindingRequests] = useState([]);
  const [activeBindings, setActiveBindings] = useState([]);

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

      const { data: vids } = await supabase
        .from('fighter_videos')
        .select('*')
        .eq('fighter_id', currentUser.id)
        .order('created_at', { ascending: false });
      setVideos(vids || []);

      const { data: records } = await supabase
        .from('fight_records')
        .select('*')
        .eq('fighter_id', currentUser.id);
      setFightRecords(records || []);

      // Fetch challenges
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*, challenger:challenger_id(id, full_name, avatar_url), challenged:challenged_id(id, full_name, avatar_url)')
        .or(`challenger_id.eq.${currentUser.id},challenged_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });
      setChallenges(challengeData || []);

      // Fetch my coaches (fighter_coaches)
      const { data: coachLinks } = await supabase
        .from('fighter_coaches')
        .select('*, coach:coach_id(id, full_name, avatar_url)')
        .eq('fighter_id', currentUser.id);
      setMyCoaches(coachLinks || []);
    }

    if (profileData?.role === 'coach') {
      const { data: exps } = await supabase
        .from('coach_experiences')
        .select('*')
        .eq('coach_id', currentUser.id)
        .order('period_start', { ascending: false });
      setExperiences(exps || []);

      // Fetch binding requests (pending)
      const { data: pendingReqs } = await supabase
        .from('fighter_coaches')
        .select('*, fighter:fighter_id(id, full_name, avatar_url)')
        .eq('coach_id', currentUser.id)
        .eq('status', 'pending');
      setBindingRequests(pendingReqs || []);

      // Fetch active bindings
      const { data: activeReqs } = await supabase
        .from('fighter_coaches')
        .select('*, fighter:fighter_id(id, full_name, avatar_url)')
        .eq('coach_id', currentUser.id)
        .eq('status', 'active');
      setActiveBindings(activeReqs || []);
    }

    setLoading(false);
  }

  // ===== Martial Arts =====
  function openAddArt() {
    setEditingArtId(null);
    setArtForm({ art_name: '', level: '', started_at: '', description: '' });
    setShowArtModal(true);
  }

  function openEditArt(art) {
    setEditingArtId(art.id);
    setArtForm({
      art_name: art.art_name || '',
      level: art.level || '',
      started_at: art.started_at || '',
      description: art.description || '',
    });
    setShowArtModal(true);
  }

  async function handleSaveMartialArt(e) {
    e.preventDefault();
    const payload = {
      art_name: artForm.art_name,
      level: artForm.level,
      started_at: artForm.started_at || null,
      description: artForm.description,
    };

    let error;
    if (editingArtId) {
      ({ error } = await supabase
        .from('fighter_martial_arts')
        .update(payload)
        .eq('id', editingArtId));
    } else {
      ({ error } = await supabase
        .from('fighter_martial_arts')
        .insert({ ...payload, fighter_id: user.id }));
    }

    if (!error) {
      setShowArtModal(false);
      fetchUserAndProfile();
    }
  }

  async function handleDeleteMartialArt(artId) {
    if (!confirm('Tem certeza que deseja excluir esta arte marcial?')) return;
    const { error } = await supabase
      .from('fighter_martial_arts')
      .delete()
      .eq('id', artId);
    if (!error) fetchUserAndProfile();
  }

  // ===== Videos =====
  function openAddVideo() {
    setEditingVideoId(null);
    setVideoForm({ youtube_url: '', title: '', modality: '', fight_date: '' });
    setShowVideoModal(true);
  }

  function openEditVideo(video) {
    setEditingVideoId(video.id);
    setVideoForm({
      youtube_url: video.youtube_url || '',
      title: video.title || '',
      modality: video.modality || '',
      fight_date: video.fight_date || '',
    });
    setShowVideoModal(true);
  }

  async function handleSaveVideo(e) {
    e.preventDefault();
    const payload = {
      youtube_url: videoForm.youtube_url,
      title: videoForm.title || null,
      modality: videoForm.modality || null,
      fight_date: videoForm.fight_date || null,
    };

    let error;
    if (editingVideoId) {
      ({ error } = await supabase
        .from('fighter_videos')
        .update(payload)
        .eq('id', editingVideoId));
    } else {
      ({ error } = await supabase
        .from('fighter_videos')
        .insert({ ...payload, fighter_id: user.id }));
    }

    if (!error) {
      setShowVideoModal(false);
      fetchUserAndProfile();
    }
  }

  async function handleDeleteVideo(videoId) {
    if (!confirm('Tem certeza que deseja excluir este video?')) return;
    const { error } = await supabase
      .from('fighter_videos')
      .delete()
      .eq('id', videoId);
    if (!error) fetchUserAndProfile();
  }

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&?\s]+)/);
    return match ? match[1] : null;
  }

  // ===== Experiences (Coach) =====
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

  // ===== Edit Profile =====
  function openEditProfile() {
    setEditForm({
      full_name: profile?.full_name || '',
      birth_date: profile?.birth_date || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      state: profile?.state || '',
      bio: profile?.bio || '',
      instagram: profile?.instagram || '',
      facebook: profile?.facebook || '',
      youtube: profile?.youtube || '',
      tiktok: profile?.tiktok || '',
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
          phone: editForm.phone || null,
          city: editForm.city || null,
          state: editForm.state || null,
          bio: editForm.bio || null,
          instagram: editForm.instagram || null,
          facebook: editForm.facebook || null,
          youtube: editForm.youtube || null,
          tiktok: editForm.tiktok || null,
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

  // ===== Challenges =====
  async function handleRespondChallenge(challengeId, newStatus) {
    const { error } = await supabase
      .from('challenges')
      .update({ status: newStatus })
      .eq('id', challengeId);
    if (!error) fetchUserAndProfile();
  }

  // ===== Result Reporting =====
  function openResultModal(challenge) {
    setResultChallenge(challenge);
    setShowResultModal(true);
  }

  async function handleReportResult(challenge, result) {
    // result: 'win', 'loss', or 'draw'
    setResultSaving(true);
    let winnerId = null;
    if (result === 'win') {
      winnerId = user.id;
    } else if (result === 'loss') {
      winnerId = challenge.challenger_id === user.id ? challenge.challenged_id : challenge.challenger_id;
    }
    // result === 'draw' → winnerId stays null

    const { error } = await supabase
      .from('challenges')
      .update({
        winner_id: winnerId,
        result_reported_by: user.id,
        status: 'result_pending',
      })
      .eq('id', challenge.id);

    setResultSaving(false);
    if (!error) {
      setShowResultModal(false);
      setResultChallenge(null);
      fetchUserAndProfile();
    }
  }

  async function handleConfirmResult(challenge) {
    setResultSaving(true);

    // 1. Mark challenge as completed
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ status: 'completed' })
      .eq('id', challenge.id);

    if (updateError) {
      setResultSaving(false);
      return;
    }

    // 2. Update fight_records for both fighters
    const fighters = [challenge.challenger_id, challenge.challenged_id];
    const modality = challenge.modality || 'Geral';

    for (const fighterId of fighters) {
      // Check existing record for this modality
      const { data: existing } = await supabase
        .from('fight_records')
        .select('*')
        .eq('fighter_id', fighterId)
        .eq('modality', modality)
        .single();

      if (existing) {
        const updates = {};
        if (challenge.winner_id === null) {
          updates.draws = (existing.draws || 0) + 1;
        } else if (challenge.winner_id === fighterId) {
          updates.wins = (existing.wins || 0) + 1;
        } else {
          updates.losses = (existing.losses || 0) + 1;
        }
        await supabase
          .from('fight_records')
          .update(updates)
          .eq('id', existing.id);
      } else {
        const newRecord = {
          fighter_id: fighterId,
          modality,
          wins: challenge.winner_id === fighterId ? 1 : 0,
          losses: challenge.winner_id !== null && challenge.winner_id !== fighterId ? 1 : 0,
          draws: challenge.winner_id === null ? 1 : 0,
        };
        await supabase.from('fight_records').insert(newRecord);
      }
    }

    setResultSaving(false);
    fetchUserAndProfile();
  }

  async function handleContestResult(challenge) {
    const { error } = await supabase
      .from('challenges')
      .update({
        status: 'accepted',
        winner_id: null,
        result_reported_by: null,
      })
      .eq('id', challenge.id);
    if (!error) fetchUserAndProfile();
  }

  function getResultLabel(challenge) {
    if (challenge.winner_id === null) return 'Empate';
    if (challenge.winner_id === challenge.challenger_id) {
      return `${challenge.challenger?.full_name || 'Desafiante'} venceu`;
    }
    return `${challenge.challenged?.full_name || 'Desafiado'} venceu`;
  }

  // ===== Coach Management (Fighter) =====
  async function openCoachModal() {
    setShowCoachModal(true);
    setLoadingCoaches(true);
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'coach')
      .eq('status', 'active');
    setAvailableCoaches(coaches || []);
    setLoadingCoaches(false);
  }

  async function handleRequestCoach(coachId) {
    const { error } = await supabase
      .from('fighter_coaches')
      .insert({ fighter_id: user.id, coach_id: coachId, status: 'pending' });
    if (error) {
      if (error.code === '23505') {
        alert('Você já possui um vínculo com este treinador.');
      } else {
        alert('Erro ao solicitar vínculo: ' + error.message);
      }
    } else {
      setShowCoachModal(false);
      fetchUserAndProfile();
    }
  }

  async function handleRemoveCoach(linkId) {
    if (!confirm('Tem certeza que deseja remover este vínculo?')) return;
    const { error } = await supabase
      .from('fighter_coaches')
      .delete()
      .eq('id', linkId);
    if (!error) fetchUserAndProfile();
  }

  // ===== Binding Requests (Coach) =====
  async function handleRespondBinding(linkId, newStatus) {
    const { error } = await supabase
      .from('fighter_coaches')
      .update({ status: newStatus })
      .eq('id', linkId);
    if (!error) fetchUserAndProfile();
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

  function getChallengeStatusBadge(status) {
    const styles = {
      pending: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
      accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
      declined: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-white/10 text-white/40 border-white/10',
      result_pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    const labels = {
      pending: 'Pendente',
      accepted: 'Aceito',
      declined: 'Recusado',
      cancelled: 'Cancelado',
      result_pending: 'Aguardando Resultado',
      completed: 'Concluido',
    };
    return (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border ${
          styles[status] || styles.pending
        }`}
      >
        {labels[status] || status}
      </span>
    );
  }

  function formatSocialUrl(type, handle) {
    if (!handle) return null;
    const clean = handle.replace(/^@/, '');
    if (handle.startsWith('http')) return handle;
    switch (type) {
      case 'instagram': return `https://instagram.com/${clean}`;
      case 'facebook': return `https://facebook.com/${clean}`;
      case 'youtube': return `https://youtube.com/@${clean}`;
      case 'tiktok': return `https://tiktok.com/@${clean}`;
      default: return handle;
    }
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

  const receivedChallenges = challenges.filter(c => c.challenged_id === user?.id);
  const sentChallenges = challenges.filter(c => c.challenger_id === user?.id);

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
                {(profile?.city || profile?.state) && (
                  <p className="font-barlow text-sm text-white/40 flex items-center gap-1.5 mt-0.5">
                    <Icon name="map-pin" size={13} />
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="font-barlow-condensed text-sm uppercase tracking-wider text-white/60 mt-1">
                  {isFighter ? 'Lutador' : 'Treinador'}
                </p>
                <div className="mt-2">{getStatusBadge(profile?.status)}</div>
              </div>
            </div>
          </div>

          {/* Social Info */}
          {(profile?.bio || profile?.phone || profile?.instagram || profile?.facebook || profile?.youtube || profile?.tiktok) && (
            <div className="px-6 py-4 border-t border-white/5">
              {profile.bio && (
                <p className="font-barlow text-sm text-white/50 mb-3 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {profile.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40 font-barlow">
                    <Icon name="phone" size={13} />
                    {profile.phone}
                  </span>
                )}
                {profile.instagram && (
                  <a
                    href={formatSocialUrl('instagram', profile.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-pink-400 transition-colors font-barlow"
                  >
                    <Icon name="instagram" size={13} />
                    {profile.instagram}
                  </a>
                )}
                {profile.facebook && (
                  <a
                    href={formatSocialUrl('facebook', profile.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-blue-400 transition-colors font-barlow"
                  >
                    <Icon name="facebook" size={13} />
                    {profile.facebook}
                  </a>
                )}
                {profile.youtube && (
                  <a
                    href={formatSocialUrl('youtube', profile.youtube)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors font-barlow"
                  >
                    <Icon name="youtube" size={13} />
                    {profile.youtube}
                  </a>
                )}
                {profile.tiktok && (
                  <a
                    href={formatSocialUrl('tiktok', profile.tiktok)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors font-barlow"
                  >
                    <Icon name="tiktok" size={13} />
                    {profile.tiktok}
                  </a>
                )}
              </div>
            </div>
          )}

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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-barlow-condensed text-white font-semibold">
                        {art.art_name}
                      </p>
                      <p className="font-barlow text-white/40 text-sm">
                        {art.level}
                        {art.started_at && ` · Desde ${art.started_at}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditArt(art)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-[#C41E3A] hover:bg-[#C41E3A]/10 transition-all"
                        title="Editar"
                      >
                        <Icon name="settings" size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMartialArt(art.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Excluir"
                      >
                        <Icon name="x" size={14} />
                      </button>
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

        {/* Fighter: Videos List */}
        {isFighter && videos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              VIDEOS
            </h3>
            <div className="space-y-3">
              {videos.map((video) => {
                const ytId = getYoutubeId(video.youtube_url);
                return (
                  <div
                    key={video.id}
                    className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 overflow-hidden"
                  >
                    {ytId && (
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={video.title || 'Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {video.title && (
                            <p className="font-barlow-condensed text-white font-semibold">
                              {video.title}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {video.modality && (
                              <span className="font-barlow text-white/40 text-xs">
                                {video.modality}
                              </span>
                            )}
                            {video.fight_date && (
                              <span className="font-barlow text-white/40 text-xs">
                                {video.fight_date}
                              </span>
                            )}
                          </div>
                          {!ytId && (
                            <a
                              href={video.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-barlow text-[#C41E3A] text-sm hover:underline mt-1 inline-block"
                            >
                              Assistir no YouTube
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditVideo(video)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-[#C41E3A] hover:bg-[#C41E3A]/10 transition-all"
                            title="Editar"
                          >
                            <Icon name="settings" size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Excluir"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fighter: My Coaches */}
        {isFighter && myCoaches.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              MEUS TREINADORES
            </h3>
            <div className="space-y-3">
              {myCoaches.map((link) => (
                <div
                  key={link.id}
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={link.coach?.full_name} url={link.coach?.avatar_url} size={40} />
                    <div>
                      <Link
                        href={`/treinadores/${link.coach?.id}`}
                        className="font-barlow-condensed text-white font-semibold hover:text-[#D4AF37] transition-colors"
                      >
                        {link.coach?.full_name || 'Treinador'}
                      </Link>
                      <div className="mt-0.5">
                        {getChallengeStatusBadge(link.status === 'active' ? 'accepted' : link.status)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCoach(link.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Remover"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fighter: Action Cards */}
        {isFighter && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={openAddArt}
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

            <button
              onClick={openAddVideo}
              className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 hover:border-[#C41E3A]/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3 group-hover:bg-[#C41E3A]/30 transition-colors">
                <Icon name="video" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Adicionar Video
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                {videos.length > 0 ? `${videos.length} video(s)` : 'Registre suas lutas'}
              </p>
            </button>

            <button
              onClick={() => setShowChallengesSection(!showChallengesSection)}
              className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 hover:border-[#C41E3A]/30 transition-all text-left relative"
            >
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3 group-hover:bg-[#C41E3A]/30 transition-colors">
                <Icon name="swords" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Meus Desafios
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                {challenges.length > 0 ? `${challenges.length} desafio(s)` : 'Nenhum desafio ainda'}
              </p>
              {(() => {
                const pendingCount = receivedChallenges.filter(c => c.status === 'pending').length;
                const resultPendingCount = challenges.filter(c => c.status === 'result_pending' && c.result_reported_by !== user?.id).length;
                const total = pendingCount + resultPendingCount;
                return total > 0 ? (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-barlow-condensed">
                    {total}
                  </span>
                ) : null;
              })()}
            </button>

            <button
              onClick={openCoachModal}
              className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10 hover:border-[#C41E3A]/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 flex items-center justify-center mb-3 group-hover:bg-[#C41E3A]/30 transition-colors">
                <Icon name="users" size={18} className="text-[#C41E3A]" />
              </div>
              <p className="font-barlow-condensed text-white font-semibold text-sm uppercase tracking-wider">
                Gerenciar Treinadores
              </p>
              <p className="font-barlow text-white/40 text-xs mt-1">
                Vincule-se a treinadores
              </p>
            </button>
          </div>
        )}

        {/* Fighter: Challenges Section */}
        {isFighter && showChallengesSection && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              MEUS DESAFIOS
            </h3>

            {/* Received Challenges */}
            {receivedChallenges.length > 0 && (
              <div className="mb-6">
                <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mb-3">
                  Desafios Recebidos
                </p>
                <div className="space-y-3">
                  {receivedChallenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={ch.challenger?.full_name} url={ch.challenger?.avatar_url} size={36} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">
                              {ch.challenger?.full_name}
                            </p>
                            {ch.modality && (
                              <p className="font-barlow text-white/40 text-xs">
                                {ch.modality}
                              </p>
                            )}
                          </div>
                        </div>
                        {ch.status === 'pending' ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleRespondChallenge(ch.id, 'accepted')}
                              className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-green-500/30 transition-all"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => handleRespondChallenge(ch.id, 'declined')}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-red-500/30 transition-all"
                            >
                              Recusar
                            </button>
                          </div>
                        ) : ch.status === 'accepted' ? (
                          <button
                            onClick={() => openResultModal(ch)}
                            className="px-3 py-1.5 rounded-lg bg-[#C41E3A]/20 border border-[#C41E3A]/30 text-[#C41E3A] text-xs font-barlow-condensed uppercase tracking-wider hover:bg-[#C41E3A]/30 transition-all shrink-0"
                          >
                            Registrar Resultado
                          </button>
                        ) : ch.status === 'result_pending' ? (
                          ch.result_reported_by === user?.id ? (
                            <div className="text-right shrink-0">
                              {getChallengeStatusBadge(ch.status)}
                              <p className="font-barlow text-white/30 text-xs mt-1">
                                Aguardando confirmacao
                              </p>
                              <p className="font-barlow text-white/50 text-xs">
                                {getResultLabel(ch)}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <p className="font-barlow text-orange-400 text-xs font-semibold">
                                Resultado: {getResultLabel(ch)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleConfirmResult(ch)}
                                  disabled={resultSaving}
                                  className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-green-500/30 transition-all disabled:opacity-50"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => handleContestResult(ch)}
                                  disabled={resultSaving}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-red-500/30 transition-all disabled:opacity-50"
                                >
                                  Contestar
                                </button>
                              </div>
                            </div>
                          )
                        ) : ch.status === 'completed' ? (
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border bg-green-500/20 text-green-400 border-green-500/30">
                              Concluido
                            </span>
                            <p className="font-barlow text-green-400/70 text-xs mt-1">
                              {getResultLabel(ch)}
                            </p>
                          </div>
                        ) : (
                          getChallengeStatusBadge(ch.status)
                        )}
                      </div>
                      {ch.message && (
                        <p className="font-barlow text-white/30 text-sm mt-2 italic">
                          &ldquo;{ch.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Challenges */}
            {sentChallenges.length > 0 && (
              <div>
                <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mb-3">
                  Desafios Enviados
                </p>
                <div className="space-y-3">
                  {sentChallenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={ch.challenged?.full_name} url={ch.challenged?.avatar_url} size={36} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">
                              {ch.challenged?.full_name}
                            </p>
                            {ch.modality && (
                              <p className="font-barlow text-white/40 text-xs">
                                {ch.modality}
                              </p>
                            )}
                          </div>
                        </div>
                        {ch.status === 'accepted' ? (
                          <button
                            onClick={() => openResultModal(ch)}
                            className="px-3 py-1.5 rounded-lg bg-[#C41E3A]/20 border border-[#C41E3A]/30 text-[#C41E3A] text-xs font-barlow-condensed uppercase tracking-wider hover:bg-[#C41E3A]/30 transition-all shrink-0"
                          >
                            Registrar Resultado
                          </button>
                        ) : ch.status === 'result_pending' ? (
                          ch.result_reported_by === user?.id ? (
                            <div className="text-right shrink-0">
                              {getChallengeStatusBadge(ch.status)}
                              <p className="font-barlow text-white/30 text-xs mt-1">
                                Aguardando confirmacao
                              </p>
                              <p className="font-barlow text-white/50 text-xs">
                                {getResultLabel(ch)}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <p className="font-barlow text-orange-400 text-xs font-semibold">
                                Resultado: {getResultLabel(ch)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleConfirmResult(ch)}
                                  disabled={resultSaving}
                                  className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-green-500/30 transition-all disabled:opacity-50"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => handleContestResult(ch)}
                                  disabled={resultSaving}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-red-500/30 transition-all disabled:opacity-50"
                                >
                                  Contestar
                                </button>
                              </div>
                            </div>
                          )
                        ) : ch.status === 'completed' ? (
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border bg-green-500/20 text-green-400 border-green-500/30">
                              Concluido
                            </span>
                            <p className="font-barlow text-green-400/70 text-xs mt-1">
                              {getResultLabel(ch)}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            {getChallengeStatusBadge(ch.status)}
                            {ch.status === 'pending' && (
                              <button
                                onClick={() => handleRespondChallenge(ch.id, 'cancelled')}
                                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Cancelar"
                              >
                                <Icon name="x" size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {ch.message && (
                        <p className="font-barlow text-white/30 text-sm mt-2 italic">
                          &ldquo;{ch.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challenges.length === 0 && (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-8 border border-white/10 text-center">
                <p className="font-barlow text-white/30">
                  Nenhum desafio ainda. Visite o perfil de um lutador para desafia-lo!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coach: Binding Requests */}
        {isCoach && bindingRequests.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              PEDIDOS DE VINCULO
            </h3>
            <div className="space-y-3">
              {bindingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-[#D4AF37]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.fighter?.full_name} url={req.fighter?.avatar_url} size={40} />
                      <div>
                        <Link
                          href={`/lutadores/${req.fighter?.id}`}
                          className="font-barlow-condensed text-white font-semibold hover:text-[#D4AF37] transition-colors"
                        >
                          {req.fighter?.full_name || 'Lutador'}
                        </Link>
                        <p className="font-barlow text-white/40 text-xs">
                          Solicitou vinculo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondBinding(req.id, 'active')}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-green-500/30 transition-all"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRespondBinding(req.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-barlow-condensed uppercase tracking-wider hover:bg-red-500/30 transition-all"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach: Active Bindings */}
        {isCoach && activeBindings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bebas text-xl tracking-wider text-white/80 mb-4">
              LUTADORES VINCULADOS
            </h3>
            <div className="space-y-3">
              {activeBindings.map((bind) => (
                <div
                  key={bind.id}
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10 flex items-center gap-3"
                >
                  <Avatar name={bind.fighter?.full_name} url={bind.fighter?.avatar_url} size={40} />
                  <Link
                    href={`/lutadores/${bind.fighter?.id}`}
                    className="font-barlow-condensed text-white font-semibold hover:text-[#D4AF37] transition-colors"
                  >
                    {bind.fighter?.full_name || 'Lutador'}
                  </Link>
                  <span className="ml-auto">
                    {getStatusBadge('active')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach: Experiences */}
        {isCoach && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bebas text-xl tracking-wider text-white/80">
                MINHAS EXPERIENCIAS
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

      {/* Add/Edit Martial Art Modal (Fighter) */}
      {showArtModal && (
        <Modal onClose={() => setShowArtModal(false)} title={editingArtId ? 'Editar Arte Marcial' : 'Adicionar Arte Marcial'}>
          <form onSubmit={handleSaveMartialArt} className="space-y-4">
            <InputField
              label="Nome da Arte Marcial"
              type="text"
              value={artForm.art_name}
              onChange={(e) => setArtForm({ ...artForm, art_name: e.target.value })}
              placeholder="Ex: Muay Thai, Jiu-Jitsu, Boxe"
              required
            />
            <InputField
              label="Nivel"
              type="text"
              value={artForm.level}
              onChange={(e) => setArtForm({ ...artForm, level: e.target.value })}
              placeholder="Ex: Iniciante, Intermediario, Avancado"
              required
            />
            <InputField
              label="Data de Inicio"
              type="date"
              value={artForm.started_at}
              onChange={(e) =>
                setArtForm({ ...artForm, started_at: e.target.value })
              }
            />
            <div>
              <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-white/50 mb-2">
                Descricao
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
              label="Titulo"
              type="text"
              value={expForm.title}
              onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              placeholder="Ex: Treinador Principal"
              required
            />
            <InputField
              label="Organizacao"
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
                label="Inicio"
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
                Descricao
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
        <Modal onClose={() => setShowEditProfile(false)} title="Editar Perfil" maxWidth="max-w-2xl">
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

            {/* Bio */}
            <div>
              <label className="block font-barlow-condensed text-xs uppercase tracking-widest text-white/50 mb-1.5 font-semibold">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                placeholder="Conte um pouco sobre voce..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-barlow text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C41E3A]/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Telefone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
              <InputField
                label="Cidade"
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="Sua cidade"
              />
            </div>

            <InputField
              label="Estado"
              type="text"
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              placeholder="Ex: SP, RJ, MG"
            />

            {/* Social Separator */}
            <div className="border-t border-white/10 pt-4">
              <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">
                Redes Sociais
              </p>
              <div className="space-y-3">
                <InputField
                  label="Instagram"
                  type="text"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                  placeholder="@seu_usuario"
                />
                <InputField
                  label="Facebook"
                  type="text"
                  value={editForm.facebook}
                  onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                  placeholder="seu.perfil ou URL"
                />
                <InputField
                  label="YouTube"
                  type="text"
                  value={editForm.youtube}
                  onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                  placeholder="@seu_canal ou URL"
                />
                <InputField
                  label="TikTok"
                  type="text"
                  value={editForm.tiktok}
                  onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                  placeholder="@seu_usuario"
                />
              </div>
            </div>

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

      {/* Add/Edit Video Modal (Fighter) */}
      {showVideoModal && (
        <Modal onClose={() => setShowVideoModal(false)} title={editingVideoId ? 'Editar Video' : 'Adicionar Video'}>
          <form onSubmit={handleSaveVideo} className="space-y-4">
            <InputField
              label="URL do YouTube"
              type="url"
              value={videoForm.youtube_url}
              onChange={(e) => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <InputField
              label="Titulo"
              type="text"
              value={videoForm.title}
              onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
              placeholder="Ex: Luta no Campeonato Estadual"
            />
            <InputField
              label="Modalidade"
              type="text"
              value={videoForm.modality}
              onChange={(e) => setVideoForm({ ...videoForm, modality: e.target.value })}
              placeholder="Ex: Muay Thai, Jiu-Jitsu"
            />
            <InputField
              label="Data da Luta"
              type="date"
              value={videoForm.fight_date}
              onChange={(e) => setVideoForm({ ...videoForm, fight_date: e.target.value })}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all"
            >
              SALVAR
            </button>
          </form>
        </Modal>
      )}

      {/* Result Reporting Modal */}
      {showResultModal && resultChallenge && (
        <Modal onClose={() => { setShowResultModal(false); setResultChallenge(null); }} title="Registrar Resultado">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="font-barlow text-white/60 text-sm">
                Desafio contra{' '}
                <span className="text-white font-semibold">
                  {resultChallenge.challenger_id === user?.id
                    ? resultChallenge.challenged?.full_name
                    : resultChallenge.challenger?.full_name}
                </span>
              </p>
              {resultChallenge.modality && (
                <p className="font-barlow text-white/40 text-xs mt-1">
                  Modalidade: {resultChallenge.modality}
                </p>
              )}
            </div>

            <button
              onClick={() => handleReportResult(resultChallenge, 'win')}
              disabled={resultSaving}
              className="w-full py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:bg-green-500/30 transition-all disabled:opacity-50"
            >
              Eu Venci
            </button>

            <button
              onClick={() => handleReportResult(resultChallenge, 'loss')}
              disabled={resultSaving}
              className="w-full py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              Meu Oponente Venceu
            </button>

            <button
              onClick={() => handleReportResult(resultChallenge, 'draw')}
              disabled={resultSaving}
              className="w-full py-3 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:bg-[#D4AF37]/30 transition-all disabled:opacity-50"
            >
              Empate
            </button>
          </div>
        </Modal>
      )}

      {/* Coach Management Modal (Fighter) */}
      {showCoachModal && (
        <Modal onClose={() => setShowCoachModal(false)} title="Selecionar Treinador">
          {loadingCoaches ? (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-[#C41E3A]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : availableCoaches.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {availableCoaches.map((coach) => {
                const existing = myCoaches.find(mc => mc.coach_id === coach.id);
                return (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={coach.full_name} url={coach.avatar_url} size={36} />
                      <p className="font-barlow-condensed text-white font-semibold text-sm">
                        {coach.full_name}
                      </p>
                    </div>
                    {existing ? (
                      <span className="text-xs font-barlow-condensed text-white/40 uppercase tracking-wider">
                        {existing.status === 'active' ? 'Vinculado' : existing.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestCoach(coach.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-barlow-condensed uppercase tracking-wider hover:bg-[#D4AF37]/30 transition-all"
                      >
                        Solicitar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-barlow text-white/30">
                Nenhum treinador disponivel na plataforma.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
