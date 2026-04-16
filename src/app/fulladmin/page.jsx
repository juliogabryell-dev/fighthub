'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import EventsManager from '@/components/EventsManager';
import VerifiedBadge from '@/components/VerifiedBadge';
import BindingsManager from '@/components/BindingsManager';

export default function FullAdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    activeFighters: 0,
    activeCoaches: 0,
    activeAcademies: 0,
    activeReferees: 0,
    activeTeams: 0,
    activeMatchMakers: 0,
    activeFederations: 0,
    total: 0,
    pendingBindings: 0,
  });

  // Data states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingCoachBindings, setPendingCoachBindings] = useState([]);
  const [pendingAcademyBindings, setPendingAcademyBindings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Admin users
  const [adminUsers, setAdminUsers] = useState([]);
  const [createAdminModal, setCreateAdminModal] = useState(null);
  const [resetAdminPwModal, setResetAdminPwModal] = useState(null);

  // Verification
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [pendingProfileChanges, setPendingProfileChanges] = useState([]);
  const [changeDetailModal, setChangeDetailModal] = useState(null);
  const [pendingEventRegs, setPendingEventRegs] = useState([]);
  const [allEventRegs, setAllEventRegs] = useState([]);
  const [eventRegFilter, setEventRegFilter] = useState('pending');
  const [eventRegDetailModal, setEventRegDetailModal] = useState(null);

  // UI states
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Check admin session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/fulladmin/session');
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/fulladmin/login');
          return;
        }
        setAdmin(data.admin);
      } catch {
        router.push('/fulladmin/login');
      }
    }
    checkSession();
  }, [router]);

  const fetchData = useCallback(async () => {
    // Stats
    const [
      { count: pendingCount },
      { count: fighterCount },
      { count: coachCount },
      { count: academyCount },
      { count: totalCount },
      { count: refereeCount },
      { count: teamCount },
      { count: matchMakerCount },
      { count: federationCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_fighter', true).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_coach', true).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'academy').eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'referee').eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'team').eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'match_maker').eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'federation').eq('status', 'active'),
    ]);

    // Pending bindings count
    const [{ count: coachBindingsCount }, { count: academyBindingsCount }] = await Promise.all([
      supabase.from('fighter_coaches').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('fighter_academies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      pending: pendingCount || 0,
      activeFighters: fighterCount || 0,
      activeCoaches: coachCount || 0,
      activeAcademies: academyCount || 0,
      activeReferees: refereeCount || 0,
      activeTeams: teamCount || 0,
      activeMatchMakers: matchMakerCount || 0,
      activeFederations: federationCount || 0,
      total: totalCount || 0,
      pendingBindings: (coachBindingsCount || 0) + (academyBindingsCount || 0),
    });

    // Pending users
    const { data: pending } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingUsers(pending || []);

    // All users
    const { data: all } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setAllUsers(all || []);

    // Pending coach bindings
    const { data: coachBindings } = await supabase
      .from('fighter_coaches')
      .select('*, fighter:fighter_id(id, full_name, handle, avatar_url), coach:coach_id(id, full_name, handle, avatar_url), martial_art:martial_art_id(id, art_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingCoachBindings(coachBindings || []);

    // Pending academy bindings
    const { data: academyBindings } = await supabase
      .from('fighter_academies')
      .select('*, fighter:fighter_id(id, full_name, handle, avatar_url), academy:academy_id(id, full_name, handle, avatar_url), martial_art:martial_art_id(id, art_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingAcademyBindings(academyBindings || []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (admin) {
      fetchData().then(() => setLastRefresh(new Date()));
      fetchAdmins();
      fetchVerifications();
      fetchPendingChanges();
      fetchEventRegistrations();
    }
  }, [admin, fetchData]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(() => {
      fetchData().then(() => setLastRefresh(new Date()));
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [admin, fetchData]);

  // Actions
  async function handleApprove(userId) {
    setActionLoading(userId);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    // Also approve entity-specific records
    const entityTables = ['referees', 'teams', 'match_makers', 'federations'];
    for (const table of entityTables) {
      await supabase.from(table).update({ status: 'active' }).eq('owner_id', userId);
    }
    await fetchData();
    setActionLoading(null);
  }

  async function handleReject(userId) {
    setActionLoading(userId);
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
    const entityTables = ['referees', 'teams', 'match_makers', 'federations'];
    for (const table of entityTables) {
      await supabase.from(table).update({ status: 'rejected' }).eq('owner_id', userId);
    }
    await fetchData();
    setActionLoading(null);
  }

  async function handleBindingAction(table, bindingId, newStatus) {
    setActionLoading(bindingId);
    try {
      const res = await fetch('/api/fulladmin/update-binding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, binding_id: bindingId, new_status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao atualizar vínculo.');
    }
    await fetchData();
    setActionLoading(null);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
    setLastRefresh(new Date());
    setRefreshing(false);
  }

  async function handleDeleteUser(userId, userName) {
    if (!confirm(`Tem certeza que deseja excluir "${userName}"? Esta ação não pode ser desfeita.`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch('/api/fulladmin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
      } else {
        alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao excluir usuário.');
    }
    setActionLoading(null);
  }

  async function handleResetPassword(userId, userName) {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/fulladmin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (res.ok && data.temp_password) {
        setTempPasswordModal({ name: userName, password: data.temp_password });
      } else {
        alert('Erro ao resetar senha: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao resetar senha.');
    }
    setActionLoading(null);
  }

  async function handleEditSave() {
    if (!editModal) return;
    setActionLoading(editModal.id);
    await supabase.from('profiles').update({
      full_name: editModal.full_name,
      role: editModal.role,
      status: editModal.status,
      city: editModal.city,
      state: editModal.state,
      bio: editModal.bio,
      is_fighter: editModal.is_fighter,
      is_coach: editModal.is_coach,
    }).eq('id', editModal.id);
    await fetchData();
    setActionLoading(null);
    setEditModal(null);
  }

  async function fetchAdmins() {
    try {
      const res = await fetch('/api/fulladmin/manage-admins');
      const data = await res.json();
      if (res.ok) setAdminUsers(data.admins || []);
    } catch { /* ignore */ }
  }

  async function fetchVerifications() {
    try {
      const res = await fetch('/api/fulladmin/verification');
      const data = await res.json();
      if (res.ok) setPendingVerifications(data.pending || []);
    } catch { /* ignore */ }
  }

  async function fetchPendingChanges() {
    try {
      const res = await fetch('/api/fulladmin/pending-changes');
      const data = await res.json();
      if (res.ok) setPendingProfileChanges(data.changes || []);
    } catch { /* ignore */ }
  }

  async function handlePendingChange(changeId, action) {
    setActionLoading('pc-' + changeId);
    try {
      await fetch('/api/fulladmin/pending-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: changeId, action }),
      });
      await fetchPendingChanges();
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function fetchEventRegistrations() {
    try {
      // Fetch pending (for tab count)
      const resPending = await fetch('/api/event-registration?pending=true');
      const dataPending = await resPending.json();
      if (resPending.ok) setPendingEventRegs(dataPending.registrations || []);

      // Fetch all (for full list)
      const resAll = await fetch('/api/event-registration?all=true');
      const dataAll = await resAll.json();
      if (resAll.ok) setAllEventRegs(dataAll.registrations || []);
    } catch { /* ignore */ }
  }

  async function handleEventRegAction(regId, status) {
    setActionLoading('er-' + regId);
    try {
      await fetch('/api/event-registration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId, status }),
      });
      await fetchEventRegistrations();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleEventRegDelete(regId) {
    if (!confirm('Tem certeza que deseja anular esta inscrição? O lutador poderá se inscrever novamente.')) return;
    setActionLoading('er-del-' + regId);
    try {
      await fetch('/api/event-registration', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId }),
      });
      await fetchEventRegistrations();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleEventRegBulkDelete(eventId, eventTitle) {
    if (!confirm(`Tem certeza que deseja anular TODAS as inscrições do evento "${eventTitle}"? Todos os lutadores poderão se inscrever novamente.`)) return;
    setActionLoading('er-bulk-' + eventId);
    try {
      await fetch('/api/event-registration', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      await fetchEventRegistrations();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleVerification(item, action) {
    setActionLoading(item.id + item.type);
    try {
      await fetch('/api/fulladmin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, table: item.table, field: item.field, requestField: item.requestField, action }),
      });
      await fetchVerifications();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleCreateAdmin() {
    if (!createAdminModal) return;
    const { name, email, password } = createAdminModal;
    if (!name || !email || !password) {
      alert('Preencha todos os campos.');
      return;
    }
    setActionLoading('create-admin');
    try {
      const res = await fetch('/api/fulladmin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateAdminModal(null);
        await fetchAdmins();
      } else {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao criar admin.');
    }
    setActionLoading(null);
  }

  async function handleDeleteAdmin(adminId, adminName) {
    if (!confirm(`Tem certeza que deseja excluir o admin "${adminName}"?`)) return;
    setActionLoading(adminId);
    try {
      const res = await fetch('/api/fulladmin/manage-admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchAdmins();
      } else {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao excluir admin.');
    }
    setActionLoading(null);
  }

  async function handleResetAdminPassword() {
    if (!resetAdminPwModal) return;
    const { id, new_password, confirm_password } = resetAdminPwModal;
    if (!new_password || new_password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (new_password !== confirm_password) {
      alert('As senhas não coincidem.');
      return;
    }
    setActionLoading('reset-admin-pw');
    try {
      const res = await fetch('/api/fulladmin/reset-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: id, new_password }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetAdminPwModal(null);
        alert('Senha redefinida com sucesso!');
      } else {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao redefinir senha.');
    }
    setActionLoading(null);
  }

  async function handleLogout() {
    await fetch('/api/fulladmin/session', { method: 'DELETE' });
    router.push('/fulladmin/login');
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getRoleBadge(user) {
    const badges = [];
    if (user.is_fighter) badges.push({ label: 'Lutador', color: '#C41E3A' });
    if (user.is_coach) badges.push({ label: 'Treinador', color: '#D4AF37' });
    if (user.role === 'academy') badges.push({ label: 'Academia', color: '#3b82f6' });
    if (user.role === 'referee') badges.push({ label: 'Árbitro', color: '#8b5cf6' });
    if (user.role === 'team') badges.push({ label: 'Equipe', color: '#06b6d4' });
    if (user.role === 'match_maker') badges.push({ label: 'Match Maker', color: '#f59e0b' });
    if (user.role === 'federation') badges.push({ label: 'Federação', color: '#10b981' });
    if (badges.length === 0) {
      badges.push({ label: user.role, color: '#6b7280' });
    }
    return badges;
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'pending': return 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'inactive': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  }

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'fighter' && u.is_fighter) ||
      (roleFilter === 'coach' && u.is_coach) ||
      (roleFilter === 'academy' && u.role === 'academy') ||
      (roleFilter === 'referee' && u.role === 'referee') ||
      (roleFilter === 'team' && u.role === 'team') ||
      (roleFilter === 'match_maker' && u.role === 'match_maker') ||
      (roleFilter === 'federation' && u.role === 'federation');
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-[#C41E3A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const statCards = [
    { label: 'Pendentes', value: stats.pending, color: '#D4AF37', icon: 'clock' },
    { label: 'Lutadores', value: stats.activeFighters, color: '#C41E3A', icon: 'swords' },
    { label: 'Treinadores', value: stats.activeCoaches, color: '#D4AF37', icon: 'award' },
    { label: 'Academias', value: stats.activeAcademies, color: '#3b82f6', icon: 'building' },
    { label: 'Árbitros', value: stats.activeReferees, color: '#8b5cf6', icon: 'shield' },
    { label: 'Equipes', value: stats.activeTeams, color: '#06b6d4', icon: 'users' },
    { label: 'Match Makers', value: stats.activeMatchMakers, color: '#f59e0b', icon: 'link' },
    { label: 'Federações', value: stats.activeFederations, color: '#10b981', icon: 'trophy' },
    { label: 'Total', value: stats.total, color: '#22c55e', icon: 'users' },
    { label: 'Vínculos Pend.', value: stats.pendingBindings, color: '#f97316', icon: 'link' },
  ];

  const tabs = [
    { id: 'pending', label: 'Pendentes', count: stats.pending },
    { id: 'users', label: 'Todos Usuários', count: stats.total },
    { id: 'bindings', label: 'Vínculos', count: stats.pendingBindings },
    { id: 'admins', label: 'Admins', count: adminUsers.length },
    { id: 'verification', label: 'Verificações', count: pendingVerifications.length },
    { id: 'profile_changes', label: 'Alt. Perfil', count: pendingProfileChanges.length },
    { id: 'event_registrations', label: 'Inscrições', count: pendingEventRegs.length },
    { id: 'events', label: 'Eventos' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Bar */}
      <div className="bg-[#1a1a2e]/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FightLog" className="w-9 h-9 rounded-lg object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-bebas text-lg tracking-wider">
                <span className="text-white">FIGHT</span>
                <span className="text-[#C41E3A]">LOG</span>
              </span>
              <span className="text-[9px] text-[#D4AF37] font-barlow-condensed uppercase tracking-[0.2em] -mt-0.5">
                Admin Panel
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="font-barlow text-white/20 text-[10px] hidden sm:block">
                Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="font-barlow text-white/50 text-sm hidden sm:block">
              {admin?.name}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-[#22c55e] hover:border-[#22c55e]/30 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
              title="Atualizar dados"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? '...' : 'Atualizar'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-[#C41E3A] hover:border-[#C41E3A]/30 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
            >
              <Icon name="logout" size={14} />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon name={stat.icon} size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="font-bebas text-2xl tracking-wide" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-barlow-condensed text-sm uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-[#C41E3A] border-[#C41E3A]'
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-[#C41E3A]/20 text-[#C41E3A]' : 'bg-white/10 text-white/40'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-bebas text-xl tracking-wider text-white">CADASTROS PENDENTES</h2>
            </div>
            {pendingUsers.length > 0 ? (
              <div className="divide-y divide-white/5">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={user.full_name} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="font-barlow-condensed text-white font-semibold truncate flex items-center gap-1.5">{user.full_name} {(user.verified || user.fighter_verified || user.coach_verified) && <VerifiedBadge size={14} />}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.handle && (
                            <span className="font-barlow text-white/30 text-xs">@{user.handle}</span>
                          )}
                          {getRoleBadge(user).map((b) => (
                            <span key={b.label} className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border" style={{ color: b.color, backgroundColor: `${b.color}15`, borderColor: `${b.color}40` }}>
                              {b.label}
                            </span>
                          ))}
                          <span className="font-barlow text-white/20 text-xs">{formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4">
                      <button onClick={() => setSelectedUser(user)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider" disabled={actionLoading === user.id}>
                        Ver
                      </button>
                      <button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                        {actionLoading === user.id ? '...' : 'Aprovar'}
                      </button>
                      <button onClick={() => handleReject(user.id)} disabled={actionLoading === user.id} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                        {actionLoading === user.id ? '...' : 'Rejeitar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="font-barlow text-white/40 text-sm">Nenhum cadastro pendente!</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: All Users */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome ou @handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-4 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'fighter', 'coach', 'academy', 'referee', 'team', 'match_maker', 'federation'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-2 rounded-lg font-barlow-condensed text-xs uppercase tracking-wider border transition-all ${
                      roleFilter === role
                        ? 'bg-[#C41E3A]/20 border-[#C41E3A]/40 text-[#C41E3A]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {{ all: 'Todos', fighter: 'Lutadores', coach: 'Treinadores', academy: 'Academias', referee: 'Árbitros', team: 'Equipes', match_maker: 'Match Makers', federation: 'Federações' }[role]}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 font-barlow-condensed text-xs uppercase tracking-wider text-white/40">Usuário</th>
                      <th className="text-left px-4 py-3 font-barlow-condensed text-xs uppercase tracking-wider text-white/40 hidden sm:table-cell">Tipo</th>
                      <th className="text-left px-4 py-3 font-barlow-condensed text-xs uppercase tracking-wider text-white/40 hidden md:table-cell">Status</th>
                      <th className="text-left px-4 py-3 font-barlow-condensed text-xs uppercase tracking-wider text-white/40 hidden lg:table-cell">Data</th>
                      <th className="text-right px-4 py-3 font-barlow-condensed text-xs uppercase tracking-wider text-white/40">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.full_name} url={user.avatar_url} size={36} />
                            <div className="min-w-0">
                              <p className="font-barlow-condensed text-white font-semibold truncate text-sm flex items-center gap-1.5">{user.full_name} {(user.verified || user.fighter_verified || user.coach_verified) && <VerifiedBadge size={13} />}</p>
                              {user.handle && <p className="font-barlow text-white/30 text-xs">@{user.handle}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {getRoleBadge(user).map((b) => (
                              <span key={b.label} className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border" style={{ color: b.color, backgroundColor: `${b.color}15`, borderColor: `${b.color}40` }}>
                                {b.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="font-barlow text-white/30 text-xs">{formatDate(user.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setSelectedUser(user)} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider">
                              Ver
                            </button>
                            <button onClick={() => setEditModal({ ...user })} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider">
                              Editar
                            </button>
                            <button onClick={() => handleResetPassword(user.id, user.full_name)} disabled={actionLoading === user.id} className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                              {actionLoading === user.id ? '...' : 'Reset Senha'}
                            </button>
                            <button onClick={() => handleDeleteUser(user.id, user.full_name)} disabled={actionLoading === user.id} className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                              {actionLoading === user.id ? '...' : 'Excluir'}
                            </button>
                            {user.status === 'pending' && (
                              <button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id} className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                                {actionLoading === user.id ? '...' : 'Aprovar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <p className="font-barlow text-white/40 text-sm">Nenhum usuário encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Pending Bindings */}
        {activeTab === 'bindings' && (
          <BindingsManager />
        )}

        {/* Tab: Admins */}
        {activeTab === 'admins' && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bebas text-xl tracking-wider text-white">ADMINISTRADORES</h2>
              <button
                onClick={() => setCreateAdminModal({ name: '', email: '', password: '' })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-xs uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Novo Admin
              </button>
            </div>
            {adminUsers.length > 0 ? (
              <div className="divide-y divide-white/5">
                {adminUsers.map((adm) => (
                  <div key={adm.id} className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 border border-[#C41E3A]/30 flex items-center justify-center flex-shrink-0">
                        <span className="font-bebas text-lg text-[#C41E3A]">{adm.name?.charAt(0) || '?'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-barlow-condensed text-white font-semibold truncate">{adm.name}</p>
                        <p className="font-barlow text-white/30 text-xs">{adm.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-barlow text-white/20 text-xs hidden sm:block mr-1">{formatDate(adm.created_at)}</span>
                      {admin?.id === adm.id && (
                        <span className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-barlow-condensed text-[10px] uppercase tracking-wider">
                          Você
                        </span>
                      )}
                      <button
                        onClick={() => setResetAdminPwModal({ id: adm.id, name: adm.name, new_password: '', confirm_password: '' })}
                        className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider"
                      >
                        Reset Senha
                      </button>
                      {admin?.id !== adm.id && (
                        <button
                          onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                          disabled={actionLoading === adm.id}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                          {actionLoading === adm.id ? '...' : 'Excluir'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="font-barlow text-white/40 text-sm">Nenhum administrador encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Events */}
        {/* Tab: Verification */}
        {activeTab === 'verification' && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-bebas text-xl tracking-wider text-white">SOLICITAÇÕES DE VERIFICAÇÃO</h2>
            </div>
            {pendingVerifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {pendingVerifications.map((item) => (
                  <div key={item.id + item.type} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={item.name} url={item.avatar_url} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="font-barlow-condensed text-white font-semibold truncate">{item.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.handle && <span className="font-barlow text-white/30 text-xs">@{item.handle}</span>}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border bg-[#1D9BF0]/10 border-[#1D9BF0]/30 text-[#1D9BF0]">
                            {item.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleVerification(item, 'approve')}
                        disabled={actionLoading === item.id + item.type}
                        className="px-3 py-1.5 rounded-lg bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] hover:bg-[#1D9BF0]/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <VerifiedBadge size={12} />
                        {actionLoading === item.id + item.type ? '...' : 'Verificar'}
                      </button>
                      <button
                        onClick={() => handleVerification(item, 'reject')}
                        disabled={actionLoading === item.id + item.type}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                      >
                        {actionLoading === item.id + item.type ? '...' : 'Rejeitar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <VerifiedBadge size={32} className="mx-auto mb-2 opacity-30" />
                <p className="font-barlow text-white/40 text-sm">Nenhuma solicitação de verificação pendente.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Pending Profile Changes */}
        {activeTab === 'profile_changes' && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="font-bebas text-xl tracking-wider text-white">ALTERAÇÕES DE PERFIL VERIFICADO</h2>
            </div>
            {pendingProfileChanges.length > 0 ? (
              <div className="divide-y divide-white/5">
                {pendingProfileChanges.map((change) => {
                  const TYPE_LABELS = { profile: 'Perfil', martial_art: 'Modalidade', fight_record: 'Cartel', video: 'Vídeo', experience: 'Experiência' };
                  const ACTION_LABELS = { create: 'Adição', update: 'Edição', delete: 'Exclusão' };
                  const ACTION_COLORS = { create: 'bg-green-500/10 border-green-500/30 text-green-400', update: 'bg-blue-500/10 border-blue-500/30 text-blue-400', delete: 'bg-red-500/10 border-red-500/30 text-red-400' };

                  // Build summary
                  let summary = '';
                  if (change.change_type === 'profile') {
                    const keys = Object.keys(change.payload || {}).filter(k => k !== 'public_fields' && change.payload[k]);
                    summary = `Editou ${keys.length} campo(s): ${keys.slice(0, 4).map(k => k.replace(/_/g, ' ')).join(', ')}${keys.length > 4 ? '...' : ''}`;
                  } else if (change.change_type === 'martial_art') {
                    const artName = change.payload?.martial_art?.art_name || '';
                    if (change.action === 'create') summary = `Adicionou modalidade: ${artName}`;
                    else if (change.action === 'update') summary = `Editou modalidade: ${artName}`;
                    else if (change.action === 'delete') summary = 'Solicitou exclusão de modalidade';
                  } else if (change.change_type === 'video') {
                    summary = change.action === 'delete' ? 'Solicitou exclusão de vídeo' : `${change.action === 'create' ? 'Adicionou' : 'Editou'} vídeo`;
                  }

                  return (
                    <div key={change.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={change.user?.full_name} url={change.user?.avatar_url} size={40} />
                          <div className="flex-1 min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold truncate flex items-center gap-1.5">
                              {change.user?.full_name}
                              <VerifiedBadge size={14} />
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              {change.user?.handle && <span className="font-barlow text-white/30 text-xs">@{change.user.handle}</span>}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]">
                                {TYPE_LABELS[change.change_type] || change.change_type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${ACTION_COLORS[change.action] || ''}`}>
                                {ACTION_LABELS[change.action] || change.action}
                              </span>
                            </div>
                            {/* Summary line */}
                            <p className="font-barlow text-white/40 text-xs mt-1">{summary}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setChangeDetailModal(change)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => handlePendingChange(change.id, 'approve')}
                            disabled={actionLoading === 'pc-' + change.id}
                            className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                          >
                            {actionLoading === 'pc-' + change.id ? '...' : 'Aprovar'}
                          </button>
                          <button
                            onClick={() => handlePendingChange(change.id, 'reject')}
                            disabled={actionLoading === 'pc-' + change.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                          >
                            {actionLoading === 'pc-' + change.id ? '...' : 'Rejeitar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Icon name="check" size={32} className="text-white/15 mx-auto mb-2" />
                <p className="font-barlow text-white/40 text-sm">Nenhuma alteração pendente de aprovação.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Event Registrations */}
        {activeTab === 'event_registrations' && (() => {
          const filteredRegs = eventRegFilter === 'all'
            ? allEventRegs
            : allEventRegs.filter((r) => r.status === eventRegFilter);
          const statusLabel = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };
          const statusStyle = {
            pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
            approved: 'bg-green-500/10 border-green-500/30 text-green-400',
            rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
          };
          // Group by event for bulk actions
          const eventGroups = {};
          filteredRegs.forEach((r) => {
            const eid = r.event?.id;
            if (eid && !eventGroups[eid]) eventGroups[eid] = { title: r.event?.title, count: 0 };
            if (eid) eventGroups[eid].count++;
          });

          return (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-bebas text-xl tracking-wider text-white">INSCRIÇÕES EM EVENTOS</h2>
                {/* Bulk delete per event */}
                {filteredRegs.length > 0 && Object.keys(eventGroups).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(eventGroups).map(([eid, { title, count }]) => (
                      <button
                        key={eid}
                        onClick={() => handleEventRegBulkDelete(eid, title)}
                        disabled={actionLoading === 'er-bulk-' + eid}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50"
                      >
                        {actionLoading === 'er-bulk-' + eid ? '...' : `Anular todas "${title}" (${count})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Filter tabs */}
              <div className="flex gap-2 mt-3">
                {[
                  { key: 'pending', label: 'Pendentes', count: allEventRegs.filter((r) => r.status === 'pending').length },
                  { key: 'approved', label: 'Aprovadas', count: allEventRegs.filter((r) => r.status === 'approved').length },
                  { key: 'rejected', label: 'Rejeitadas', count: allEventRegs.filter((r) => r.status === 'rejected').length },
                  { key: 'all', label: 'Todas', count: allEventRegs.length },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setEventRegFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg font-barlow-condensed text-xs uppercase tracking-wider transition-all ${
                      eventRegFilter === f.key
                        ? 'bg-[#C41E3A]/20 border border-[#C41E3A]/40 text-[#C41E3A]'
                        : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>
            {filteredRegs.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredRegs.map((reg) => (
                  <div key={reg.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={reg.fighter?.full_name} url={reg.fighter?.avatar_url} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="font-barlow-condensed text-white font-semibold truncate flex items-center gap-1.5">
                            {reg.fighter?.full_name}
                            {reg.fighter?.fighter_verified && <VerifiedBadge size={14} />}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${statusStyle[reg.status] || 'bg-white/5 border-white/10 text-white/40'}`}>
                              {statusLabel[reg.status] || reg.status}
                            </span>
                          </p>
                          <p className="font-barlow text-white/30 text-xs truncate">
                            {reg.fighter?.handle && `@${reg.fighter.handle} · `}
                            Evento: <span className="text-[#C41E3A]">{reg.event?.title}</span>
                            {reg.event?.event_date && ` · ${new Date(reg.event.event_date).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEventRegDetailModal(reg)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
                        >
                          Ver Perfil
                        </button>
                        {reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEventRegAction(reg.id, 'approved')}
                              disabled={actionLoading === 'er-' + reg.id}
                              className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                            >
                              {actionLoading === 'er-' + reg.id ? '...' : 'Aprovar'}
                            </button>
                            <button
                              onClick={() => handleEventRegAction(reg.id, 'rejected')}
                              disabled={actionLoading === 'er-' + reg.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                            >
                              {actionLoading === 'er-' + reg.id ? '...' : 'Rejeitar'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEventRegDelete(reg.id)}
                          disabled={actionLoading === 'er-del-' + reg.id}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                          title="Anular inscrição - o lutador poderá se inscrever novamente"
                        >
                          {actionLoading === 'er-del-' + reg.id ? '...' : 'Anular'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Icon name="calendar" size={32} className="text-white/15 mx-auto mb-2" />
                <p className="font-barlow text-white/40 text-sm">
                  {eventRegFilter === 'all' ? 'Nenhuma inscrição encontrada.' : `Nenhuma inscrição ${statusLabel[eventRegFilter]?.toLowerCase() || ''}.`}
                </p>
              </div>
            )}
          </div>
          );
        })()}

        {/* Event Registration Detail Modal */}
        {eventRegDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setEventRegDetailModal(null)}>
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bebas text-lg tracking-wider text-white">PERFIL DO LUTADOR</h3>
                <button onClick={() => setEventRegDetailModal(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">✕</button>
              </div>
              <div className="p-5">
                {/* Fighter info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={eventRegDetailModal.fighter?.full_name} url={eventRegDetailModal.fighter?.avatar_url} size={48} />
                  <div>
                    <p className="font-barlow-condensed text-white font-semibold flex items-center gap-1.5">
                      {eventRegDetailModal.fighter?.full_name}
                      {eventRegDetailModal.fighter?.fighter_verified && <VerifiedBadge size={14} />}
                    </p>
                    {eventRegDetailModal.fighter?.handle && <p className="font-barlow text-white/30 text-xs">@{eventRegDetailModal.fighter.handle}</p>}
                  </div>
                </div>

                {/* Event */}
                <div className="p-3 bg-[#C41E3A]/10 rounded-lg border border-[#C41E3A]/20 mb-4">
                  <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-white/40">Evento</p>
                  <p className="font-barlow-condensed text-white font-semibold">{eventRegDetailModal.event?.title}</p>
                  <p className="font-barlow text-white/40 text-xs">{eventRegDetailModal.event?.event_date && new Date(eventRegDetailModal.event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>

                {/* All fighter data */}
                <div className="space-y-2">
                  {[
                    ['Nome Completo', eventRegDetailModal.fighter?.full_name],
                    ['Data de Nascimento', eventRegDetailModal.fighter?.birth_date && new Date(eventRegDetailModal.fighter.birth_date).toLocaleDateString('pt-BR')],
                    ['Nome do Pai', eventRegDetailModal.fighter?.father_name],
                    ['Nome da Mãe', eventRegDetailModal.fighter?.mother_name],
                    ['Cidade', eventRegDetailModal.fighter?.city],
                    ['Estado', eventRegDetailModal.fighter?.state],
                    ['Telefone', eventRegDetailModal.fighter?.phone],
                    ['WhatsApp', eventRegDetailModal.fighter?.whatsapp],
                    ['Altura', eventRegDetailModal.fighter?.height_cm ? `${eventRegDetailModal.fighter.height_cm} cm` : null],
                    ['Peso', eventRegDetailModal.fighter?.weight_kg ? `${eventRegDetailModal.fighter.weight_kg} kg` : null],
                    ['Tipo Sanguíneo', eventRegDetailModal.fighter?.blood_type],
                    ['Instagram', eventRegDetailModal.fighter?.instagram],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="font-barlow text-white/40 text-sm">{label}</span>
                      <span className="font-barlow text-white text-sm text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                  {eventRegDetailModal.fighter?.bio && (
                    <div className="pt-2">
                      <span className="font-barlow text-white/40 text-sm">Bio</span>
                      <p className="font-barlow text-white/70 text-sm mt-1">{eventRegDetailModal.fighter.bio}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                  {eventRegDetailModal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { handleEventRegAction(eventRegDetailModal.id, 'approved'); setEventRegDetailModal(null); }}
                        className="flex-1 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => { handleEventRegAction(eventRegDetailModal.id, 'rejected'); setEventRegDetailModal(null); }}
                        className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { handleEventRegDelete(eventRegDetailModal.id); setEventRegDetailModal(null); }}
                    className="flex-1 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
                  >
                    Anular Inscrição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Detail Modal */}
        {changeDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setChangeDetailModal(null)}>
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bebas text-lg tracking-wider text-white">DETALHES DA ALTERAÇÃO</h3>
                <button onClick={() => setChangeDetailModal(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">✕</button>
              </div>
              <div className="p-5">
                {/* User info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={changeDetailModal.user?.full_name} url={changeDetailModal.user?.avatar_url} size={40} />
                  <div>
                    <p className="font-barlow-condensed text-white font-semibold flex items-center gap-1.5">{changeDetailModal.user?.full_name} <VerifiedBadge size={14} /></p>
                    {changeDetailModal.user?.handle && <p className="font-barlow text-white/30 text-xs">@{changeDetailModal.user.handle}</p>}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]">
                    {{ profile: 'Perfil', martial_art: 'Modalidade', fight_record: 'Cartel', video: 'Vídeo', experience: 'Experiência' }[changeDetailModal.change_type]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${{ create: 'bg-green-500/10 border-green-500/30 text-green-400', update: 'bg-blue-500/10 border-blue-500/30 text-blue-400', delete: 'bg-red-500/10 border-red-500/30 text-red-400' }[changeDetailModal.action]}`}>
                    {{ create: 'Adição', update: 'Edição', delete: 'Exclusão' }[changeDetailModal.action]}
                  </span>
                  <span className="font-barlow text-white/25 text-xs">{new Date(changeDetailModal.created_at).toLocaleString('pt-BR')}</span>
                </div>

                {/* Payload details */}
                <div className="space-y-3">
                  {changeDetailModal.change_type === 'profile' && (
                    <div className="space-y-2">
                      <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 font-semibold">Campos alterados</p>
                      {Object.entries(changeDetailModal.payload || {}).filter(([k, v]) => v && k !== 'public_fields').map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="font-barlow text-white/40 text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-barlow text-white text-sm text-right max-w-[60%] truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {changeDetailModal.change_type === 'martial_art' && changeDetailModal.payload?.martial_art && (
                    <div className="space-y-3">
                      <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 font-semibold">Modalidade</p>
                      <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                        <p className="font-barlow-condensed text-white font-semibold">{changeDetailModal.payload.martial_art.art_name}</p>
                        <p className="font-barlow text-white/40 text-sm">
                          {changeDetailModal.payload.martial_art.level && `Nível: ${changeDetailModal.payload.martial_art.level}`}
                          {changeDetailModal.payload.martial_art.started_at && ` · Desde ${changeDetailModal.payload.martial_art.started_at}`}
                        </p>
                        {changeDetailModal.payload.martial_art.description && (
                          <p className="font-barlow text-white/30 text-xs mt-1">{changeDetailModal.payload.martial_art.description}</p>
                        )}
                      </div>

                      {changeDetailModal.payload.records && (
                        <>
                          <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 font-semibold">Cartel</p>
                          {[
                            { key: 'profissional', label: 'Profissional' },
                            { key: 'semi_profissional', label: 'Semi Profissional' },
                            { key: 'amador', label: 'Amador' },
                          ].map(({ key, label }) => {
                            const rec = changeDetailModal.payload.records[key];
                            if (!rec) return null;
                            const total = (parseInt(rec.wins)||0)+(parseInt(rec.losses)||0)+(parseInt(rec.draws)||0)+(parseInt(rec.no_contest)||0);
                            if (total === 0) return null;
                            return (
                              <div key={key} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                                <p className="font-barlow-condensed text-white/60 text-xs uppercase tracking-wider mb-2">{label}</p>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center p-1.5 bg-green-500/10 rounded border border-green-500/20">
                                    <p className="font-bebas text-lg text-green-500">{rec.wins||0}</p>
                                    <p className="text-[8px] text-white/40 font-barlow-condensed uppercase">V</p>
                                  </div>
                                  <div className="text-center p-1.5 bg-[#C41E3A]/10 rounded border border-[#C41E3A]/20">
                                    <p className="font-bebas text-lg text-[#C41E3A]">{rec.losses||0}</p>
                                    <p className="text-[8px] text-white/40 font-barlow-condensed uppercase">D</p>
                                  </div>
                                  <div className="text-center p-1.5 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20">
                                    <p className="font-bebas text-lg text-[#D4AF37]">{rec.draws||0}</p>
                                    <p className="text-[8px] text-white/40 font-barlow-condensed uppercase">E</p>
                                  </div>
                                  <div className="text-center p-1.5 bg-white/5 rounded border border-white/10">
                                    <p className="font-bebas text-lg text-white/40">{rec.no_contest||0}</p>
                                    <p className="text-[8px] text-white/30 font-barlow-condensed uppercase">NC</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {changeDetailModal.change_type === 'martial_art' && changeDetailModal.action === 'delete' && (
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="font-barlow text-red-400 text-sm">Solicitou a exclusão desta modalidade e seus registros de cartel.</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => { handlePendingChange(changeDetailModal.id, 'approve'); setChangeDetailModal(null); }}
                    className="flex-1 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => { handlePendingChange(changeDetailModal.id, 'reject'); setChangeDetailModal(null); }}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <EventsManager />
        )}
      </div>

      {/* Create Admin Modal */}
      {createAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setCreateAdminModal(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bebas text-xl tracking-wider text-white">NOVO ADMINISTRADOR</h3>
              <button onClick={() => setCreateAdminModal(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Nome</label>
                <input
                  type="text"
                  value={createAdminModal.name}
                  onChange={(e) => setCreateAdminModal({ ...createAdminModal, name: e.target.value })}
                  placeholder="Nome do administrador"
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={createAdminModal.email}
                  onChange={(e) => setCreateAdminModal({ ...createAdminModal, email: e.target.value.toLowerCase() })}
                  placeholder="admin@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Senha</label>
                <input
                  type="password"
                  value={createAdminModal.password}
                  onChange={(e) => setCreateAdminModal({ ...createAdminModal, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateAdminModal(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Cancelar
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={actionLoading === 'create-admin'}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-sm uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50"
              >
                {actionLoading === 'create-admin' ? 'Criando...' : 'Criar Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Admin Password Modal */}
      {resetAdminPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setResetAdminPwModal(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bebas text-xl tracking-wider text-white">REDEFINIR SENHA</h3>
              <button onClick={() => setResetAdminPwModal(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                ✕
              </button>
            </div>
            <p className="font-barlow text-white/50 text-sm mb-5">
              Redefinir senha do admin <strong className="text-white">{resetAdminPwModal.name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Nova Senha</label>
                <input
                  type="password"
                  value={resetAdminPwModal.new_password}
                  onChange={(e) => setResetAdminPwModal({ ...resetAdminPwModal, new_password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Confirmar Senha</label>
                <input
                  type="password"
                  value={resetAdminPwModal.confirm_password}
                  onChange={(e) => setResetAdminPwModal({ ...resetAdminPwModal, confirm_password: e.target.value })}
                  placeholder="Repita a nova senha"
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setResetAdminPwModal(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Cancelar
              </button>
              <button
                onClick={handleResetAdminPassword}
                disabled={actionLoading === 'reset-admin-pw'}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#b8962e] text-black font-barlow-condensed text-sm uppercase tracking-wider hover:from-[#e0bd45] hover:to-[#c4a035] transition-all disabled:opacity-50"
              >
                {actionLoading === 'reset-admin-pw' ? 'Salvando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.full_name} url={selectedUser.avatar_url} size={48} />
                <div>
                  <h3 className="font-bebas text-xl tracking-wider text-white">{selectedUser.full_name}</h3>
                  {selectedUser.handle && <p className="font-barlow text-white/30 text-xs">@{selectedUser.handle}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    {getRoleBadge(selectedUser).map((b) => (
                      <span key={b.label} className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border" style={{ color: b.color, backgroundColor: `${b.color}15`, borderColor: `${b.color}40` }}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {[
                ['Status', selectedUser.status],
                ['Cadastrado em', formatDate(selectedUser.created_at)],
                ['Data de Nascimento', formatDate(selectedUser.birth_date)],
                ['CPF', selectedUser.cpf],
                ['RG', selectedUser.rg],
                ['CPF/CNPJ', selectedUser.cpf_cnpj],
                ['Telefone', selectedUser.phone],
                ['WhatsApp', selectedUser.whatsapp],
                ['Cidade', selectedUser.city],
                ['Estado', selectedUser.state],
                ['Altura', selectedUser.height_cm ? `${selectedUser.height_cm} cm` : null],
                ['Peso', selectedUser.weight_kg ? `${selectedUser.weight_kg} kg` : null],
                ['Tipo Sanguíneo', selectedUser.blood_type],
                ['Nome do Pai', selectedUser.father_name],
                ['Nome da Mãe', selectedUser.mother_name],
                ['Instagram', selectedUser.instagram],
                ['Facebook', selectedUser.facebook],
                ['YouTube', selectedUser.youtube],
                ['TikTok', selectedUser.tiktok],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-barlow text-white/40 text-sm">{label}</span>
                  <span className={`font-barlow text-sm text-right max-w-[60%] truncate ${label === 'Status' ? getStatusColor(value).split(' ')[0] : 'text-white'}`}>{value}</span>
                </div>
              ))}
              {/* Verification Status */}
              <div className="pt-2 flex flex-wrap gap-2">
                {selectedUser.fighter_verified && (
                  <span className="text-[10px] font-barlow-condensed uppercase tracking-wider px-2 py-1 rounded-full bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] flex items-center gap-1">
                    <VerifiedBadge size={10} /> Lutador Verificado
                  </span>
                )}
                {selectedUser.coach_verified && (
                  <span className="text-[10px] font-barlow-condensed uppercase tracking-wider px-2 py-1 rounded-full bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] flex items-center gap-1">
                    <VerifiedBadge size={10} /> Treinador Verificado
                  </span>
                )}
                {selectedUser.verified && (
                  <span className="text-[10px] font-barlow-condensed uppercase tracking-wider px-2 py-1 rounded-full bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] flex items-center gap-1">
                    <VerifiedBadge size={10} /> Verificado
                  </span>
                )}
              </div>
              {selectedUser.bio && (
                <div className="pt-2">
                  <span className="font-barlow text-white/40 text-sm">Bio</span>
                  <p className="font-barlow text-white/70 text-sm mt-1">{selectedUser.bio}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditModal({ ...selectedUser }); setSelectedUser(null); }} className="flex-1 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Editar
              </button>
              <button onClick={() => { handleResetPassword(selectedUser.id, selectedUser.full_name); setSelectedUser(null); }} className="flex-1 py-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Reset Senha
              </button>
              <button onClick={() => { handleDeleteUser(selectedUser.id, selectedUser.full_name); setSelectedUser(null); }} className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Excluir
              </button>
              {selectedUser.status === 'pending' && (
                <>
                  <button onClick={() => { handleApprove(selectedUser.id); setSelectedUser(null); }} className="flex-1 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                    Aprovar
                  </button>
                  <button onClick={() => { handleReject(selectedUser.id); setSelectedUser(null); }} className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setTempPasswordModal(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-3xl mb-2 block">🔑</span>
              <h3 className="font-bebas text-xl tracking-wider text-white">SENHA RESETADA</h3>
              <p className="font-barlow text-white/50 text-sm mt-1">
                Senha de <strong className="text-white">{tempPasswordModal.name}</strong> foi resetada
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-4">
              <p className="font-barlow text-white/50 text-xs uppercase tracking-wider mb-1">Senha temporária:</p>
              <p className="font-bebas text-2xl tracking-wider text-[#D4AF37] text-center select-all">{tempPasswordModal.password}</p>
            </div>
            <p className="font-barlow text-white/40 text-xs text-center mb-4">
              Informe essa senha ao usuário. Ao fazer login, ele será obrigado a definir uma nova senha.
            </p>
            <button onClick={() => setTempPasswordModal(null)} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-sm uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all">
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setEditModal(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bebas text-xl tracking-wider text-white">EDITAR PERFIL</h3>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Nome</label>
                <input type="text" value={editModal.full_name || ''} onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Status</label>
                <select value={editModal.status || 'pending'} onChange={(e) => setEditModal({ ...editModal, status: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors">
                  <option value="pending" className="bg-[#1a1a2e]">Pendente</option>
                  <option value="active" className="bg-[#1a1a2e]">Ativo</option>
                  <option value="inactive" className="bg-[#1a1a2e]">Inativo</option>
                  <option value="rejected" className="bg-[#1a1a2e]">Rejeitado</option>
                </select>
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Role</label>
                <select value={editModal.role || 'fighter'} onChange={(e) => setEditModal({ ...editModal, role: e.target.value })} className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors">
                  <option value="fighter" className="bg-[#1a1a2e]">Lutador</option>
                  <option value="coach" className="bg-[#1a1a2e]">Treinador</option>
                  <option value="academy" className="bg-[#1a1a2e]">Academia</option>
                  <option value="referee" className="bg-[#1a1a2e]">Árbitro</option>
                  <option value="team" className="bg-[#1a1a2e]">Equipe</option>
                  <option value="match_maker" className="bg-[#1a1a2e]">Match Maker</option>
                  <option value="federation" className="bg-[#1a1a2e]">Federação</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editModal.is_fighter || false} onChange={(e) => setEditModal({ ...editModal, is_fighter: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#C41E3A] focus:ring-[#C41E3A]" />
                  <span className="font-barlow text-white/60 text-sm">Lutador</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editModal.is_coach || false} onChange={(e) => setEditModal({ ...editModal, is_coach: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]" />
                  <span className="font-barlow text-white/60 text-sm">Treinador</span>
                </label>
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Cidade</label>
                <input type="text" value={editModal.city || ''} onChange={(e) => setEditModal({ ...editModal, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Estado</label>
                <input type="text" value={editModal.state || ''} onChange={(e) => setEditModal({ ...editModal, state: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">Bio</label>
                <textarea value={editModal.bio || ''} onChange={(e) => setEditModal({ ...editModal, bio: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors resize-y" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={actionLoading === editModal.id} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-sm uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50">
                {actionLoading === editModal.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
