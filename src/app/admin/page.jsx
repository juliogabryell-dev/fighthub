'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    activeFighters: 0,
    activeCoaches: 0,
    total: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    checkAdminAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAndFetch() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      router.push('/');
      return;
    }

    await fetchData();
    setLoading(false);
  }

  async function fetchData() {
    // Fetch stats
    const { count: pendingCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: fighterCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'fighter')
      .eq('status', 'active');

    const { count: coachCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'coach')
      .eq('status', 'active');

    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({
      pending: pendingCount || 0,
      activeFighters: fighterCount || 0,
      activeCoaches: coachCount || 0,
      total: totalCount || 0,
    });

    // Fetch pending users
    const { data: pending } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingUsers(pending || []);
  }

  async function handleApprove(userId) {
    setActionLoading(userId);
    await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId);
    await fetchData();
    setActionLoading(null);
  }

  async function handleReject(userId) {
    setActionLoading(userId);
    await supabase
      .from('profiles')
      .update({ status: 'rejected' })
      .eq('id', userId);
    await fetchData();
    setActionLoading(null);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

  const statCards = [
    {
      label: 'Pendentes',
      value: stats.pending,
      color: '#D4AF37',
      icon: 'clock',
    },
    {
      label: 'Lutadores Ativos',
      value: stats.activeFighters,
      color: '#22c55e',
      icon: 'swords',
    },
    {
      label: 'Treinadores Ativos',
      value: stats.activeCoaches,
      color: '#3b82f6',
      icon: 'award',
    },
    {
      label: 'Total Cadastros',
      value: stats.total,
      color: '#C41E3A',
      icon: 'users',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C41E3A] to-[#a01830] flex items-center justify-center shadow-lg">
            <Icon name="shield" size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bebas text-4xl tracking-wider text-white">
              PAINEL <span className="text-[#C41E3A]">ADMIN</span>
            </h1>
            <p className="font-barlow text-white/40 text-sm">
              Gerencie cadastros e aprovações
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon name={stat.icon} size={18} style={{ color: stat.color }} />
                </div>
              </div>
              <p
                className="font-bebas text-3xl tracking-wide"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Pending Approvals Table */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-bebas text-xl tracking-wider text-white">
                CADASTROS PENDENTES
              </h2>
              {stats.pending > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-barlow-condensed text-xs font-semibold border border-[#D4AF37]/30">
                  {stats.pending}
                </span>
              )}
            </div>
          </div>

          {/* Table Body */}
          {pendingUsers.length > 0 ? (
            <div className="divide-y divide-white/5">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar name={user.full_name} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="font-barlow-condensed text-white font-semibold truncate">
                        {user.full_name}
                      </p>
                      <p className="font-barlow text-white/40 text-sm truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border ${
                          user.role === 'fighter'
                            ? 'bg-[#C41E3A]/20 text-[#C41E3A] border-[#C41E3A]/30'
                            : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                        }`}
                      >
                        {user.role === 'fighter' ? 'Lutador' : 'Treinador'}
                      </span>
                      <span className="font-barlow text-white/30 text-xs">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
                      disabled={actionLoading === user.id}
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {actionLoading === user.id ? '...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {actionLoading === user.id ? '...' : 'Rejeitar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="text-4xl mb-3 block">✅</span>
              <p className="font-barlow text-white/40 text-sm">
                Nenhum cadastro pendente!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Detalhes do Usuário */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.full_name} size={48} />
                <div>
                  <h3 className="font-bebas text-xl tracking-wider text-white">
                    {selectedUser.full_name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${
                      selectedUser.role === 'fighter'
                        ? 'bg-[#C41E3A]/20 text-[#C41E3A] border-[#C41E3A]/30'
                        : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                    }`}
                  >
                    {selectedUser.role === 'fighter' ? 'Lutador' : 'Treinador'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Dados Cadastrais */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-barlow text-white/40 text-sm">Data de Nascimento</span>
                <span className="font-barlow text-white text-sm">{formatDate(selectedUser.birth_date)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-barlow text-white/40 text-sm">CPF</span>
                <span className="font-barlow text-white text-sm">{selectedUser.cpf || 'Não informado'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-barlow text-white/40 text-sm">RG</span>
                <span className="font-barlow text-white text-sm">{selectedUser.rg || 'Não informado'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-barlow text-white/40 text-sm">Tipo</span>
                <span className="font-barlow text-white text-sm capitalize">{selectedUser.role === 'fighter' ? 'Lutador' : 'Treinador'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-barlow text-white/40 text-sm">Status</span>
                <span className="font-barlow text-[#D4AF37] text-sm capitalize">{selectedUser.status}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-barlow text-white/40 text-sm">Cadastrado em</span>
                <span className="font-barlow text-white text-sm">{formatDate(selectedUser.created_at)}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { handleApprove(selectedUser.id); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
              >
                Aprovar
              </button>
              <button
                onClick={() => { handleReject(selectedUser.id); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
