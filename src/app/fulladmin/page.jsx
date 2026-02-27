'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

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
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_fighter', true).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_coach', true).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'academy').eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
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
    if (admin) fetchData().then(() => setLastRefresh(new Date()));
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
    await fetchData();
    setActionLoading(null);
  }

  async function handleReject(userId) {
    setActionLoading(userId);
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
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
      (roleFilter === 'academy' && u.role === 'academy');
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
    { label: 'Total', value: stats.total, color: '#22c55e', icon: 'users' },
    { label: 'Vínculos Pend.', value: stats.pendingBindings, color: '#f97316', icon: 'link' },
  ];

  const tabs = [
    { id: 'pending', label: 'Pendentes', count: stats.pending },
    { id: 'users', label: 'Todos Usuários', count: stats.total },
    { id: 'bindings', label: 'Vínculos', count: stats.pendingBindings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Bar */}
      <div className="bg-[#1a1a2e]/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C41E3A] to-[#a01830] flex items-center justify-center">
              <Icon name="shield" size={18} className="text-white" />
            </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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
                        <p className="font-barlow-condensed text-white font-semibold truncate">{user.full_name}</p>
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
              <div className="flex-1 relative">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou @handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm pl-10 pr-4 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'fighter', 'coach', 'academy'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-2 rounded-lg font-barlow-condensed text-xs uppercase tracking-wider border transition-all ${
                      roleFilter === role
                        ? 'bg-[#C41E3A]/20 border-[#C41E3A]/40 text-[#C41E3A]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {{ all: 'Todos', fighter: 'Lutadores', coach: 'Treinadores', academy: 'Academias' }[role]}
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
                              <p className="font-barlow-condensed text-white font-semibold truncate text-sm">{user.full_name}</p>
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
          <div className="space-y-6">
            {/* Coach Bindings */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <h2 className="font-bebas text-xl tracking-wider text-white">VÍNCULOS LUTADOR → TREINADOR</h2>
                {pendingCoachBindings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-barlow-condensed text-xs font-semibold border border-[#D4AF37]/30">
                    {pendingCoachBindings.length}
                  </span>
                )}
              </div>
              {pendingCoachBindings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {pendingCoachBindings.map((binding) => (
                    <div key={binding.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Avatar name={binding.fighter?.full_name} size={32} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{binding.fighter?.full_name || 'Lutador'}</p>
                            <p className="font-barlow text-white/30 text-[10px]">Lutador</p>
                          </div>
                        </div>
                        <span className="text-white/20 text-xs">→</span>
                        <div className="flex items-center gap-2">
                          <Avatar name={binding.coach?.full_name} size={32} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{binding.coach?.full_name || 'Treinador'}</p>
                            <p className="font-barlow text-white/30 text-[10px]">Treinador</p>
                          </div>
                        </div>
                        {binding.martial_art?.art_name && (
                          <span className="px-2 py-0.5 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] font-barlow-condensed text-[10px] border border-[#C41E3A]/20">
                            {binding.martial_art.art_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleBindingAction('fighter_coaches', binding.id, 'active')} disabled={actionLoading === binding.id} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                          {actionLoading === binding.id ? '...' : 'Aprovar'}
                        </button>
                        <button onClick={() => handleBindingAction('fighter_coaches', binding.id, 'rejected')} disabled={actionLoading === binding.id} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                          {actionLoading === binding.id ? '...' : 'Rejeitar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <p className="font-barlow text-white/40 text-sm">Nenhum vínculo de treinador pendente.</p>
                </div>
              )}
            </div>

            {/* Academy Bindings */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <h2 className="font-bebas text-xl tracking-wider text-white">VÍNCULOS LUTADOR → ACADEMIA</h2>
                {pendingAcademyBindings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-barlow-condensed text-xs font-semibold border border-blue-500/30">
                    {pendingAcademyBindings.length}
                  </span>
                )}
              </div>
              {pendingAcademyBindings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {pendingAcademyBindings.map((binding) => (
                    <div key={binding.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Avatar name={binding.fighter?.full_name} size={32} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{binding.fighter?.full_name || 'Lutador'}</p>
                            <p className="font-barlow text-white/30 text-[10px]">Lutador</p>
                          </div>
                        </div>
                        <span className="text-white/20 text-xs">→</span>
                        <div className="flex items-center gap-2">
                          <Avatar name={binding.academy?.full_name} size={32} />
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{binding.academy?.full_name || 'Academia'}</p>
                            <p className="font-barlow text-white/30 text-[10px]">Academia</p>
                          </div>
                        </div>
                        {binding.martial_art?.art_name && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-barlow-condensed text-[10px] border border-blue-500/20">
                            {binding.martial_art.art_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleBindingAction('fighter_academies', binding.id, 'active')} disabled={actionLoading === binding.id} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                          {actionLoading === binding.id ? '...' : 'Aprovar'}
                        </button>
                        <button onClick={() => handleBindingAction('fighter_academies', binding.id, 'rejected')} disabled={actionLoading === binding.id} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">
                          {actionLoading === binding.id ? '...' : 'Rejeitar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <p className="font-barlow text-white/40 text-sm">Nenhum vínculo de academia pendente.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
                ['Data de Nascimento', formatDate(selectedUser.birth_date)],
                ['CPF', selectedUser.cpf || 'Não informado'],
                ['RG', selectedUser.rg || 'Não informado'],
                ['CPF/CNPJ', selectedUser.cpf_cnpj || 'Não informado'],
                ['Telefone', selectedUser.phone || 'Não informado'],
                ['Cidade', selectedUser.city || 'Não informado'],
                ['Estado', selectedUser.state || 'Não informado'],
                ['Status', selectedUser.status],
                ['Cadastrado em', formatDate(selectedUser.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-barlow text-white/40 text-sm">{label}</span>
                  <span className={`font-barlow text-sm ${label === 'Status' ? getStatusColor(value).split(' ')[0] : 'text-white'}`}>{value}</span>
                </div>
              ))}
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
                <select value={editModal.role || 'fighter'} onChange={(e) => setEditModal({ ...editModal, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors">
                  <option value="fighter" className="bg-[#1a1a2e]">Fighter</option>
                  <option value="coach" className="bg-[#1a1a2e]">Coach</option>
                  <option value="academy" className="bg-[#1a1a2e]">Academy</option>
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
