'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from './Icon';
import InputField from './InputField';

export default function EventRegistrationButton({ eventId }) {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null); // null, 'pending', 'approved', 'rejected'
  const [showForm, setShowForm] = useState(false);
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, is_fighter, father_name, mother_name')
        .eq('id', session.user.id)
        .single();

      if (!prof?.is_fighter) { setLoading(false); return; }

      setUser(session.user);
      setProfile(prof);
      setFatherName(prof.father_name || '');
      setMotherName(prof.mother_name || '');

      // Check if already registered
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('status')
        .eq('event_id', eventId)
        .eq('fighter_id', session.user.id)
        .single();

      if (reg) setStatus(reg.status);
      setLoading(false);
    }
    check();
  }, [eventId]);

  async function handleRegister() {
    if (!fatherName.trim() || !motherName.trim()) {
      alert('Nome do pai e da mãe são obrigatórios para inscrição em eventos.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/event-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          fighter_id: user.id,
          father_name: fatherName.trim(),
          mother_name: motherName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('pending');
        setShowForm(false);
        alert('Inscrição realizada com sucesso!\n\nSua inscrição está aguardando aprovação do administrador.');
      } else {
        alert(data.error || 'Erro ao se inscrever.');
      }
    } catch {
      alert('Erro ao se inscrever.');
    }
    setSaving(false);
  }

  if (loading) return null;
  if (!user || !profile) return null;

  // Already registered
  if (status) {
    const styles = {
      pending: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
      approved: 'bg-green-500/10 border-green-500/30 text-green-400',
      rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
    };
    const labels = {
      pending: 'Inscrição Pendente',
      approved: 'Inscrito',
      rejected: 'Inscrição Recusada',
    };
    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${styles[status]}`}>
        <Icon name={status === 'approved' ? 'check' : status === 'pending' ? 'clock' : 'x'} size={16} />
        <span className="font-barlow-condensed text-sm uppercase tracking-wider font-semibold">{labels[status]}</span>
      </div>
    );
  }

  if (showForm) {
    const needsParents = !profile.father_name || !profile.mother_name;
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 font-semibold">Inscrever-se no Evento</p>
        {needsParents && (
          <p className="font-barlow text-xs text-[#D4AF37]/80">
            Para se inscrever, preencha o nome do pai e da mãe. Essas informações serão salvas no seu perfil.
          </p>
        )}
        <InputField
          label="Nome do Pai"
          type="text"
          value={fatherName}
          onChange={(e) => setFatherName(e.target.value)}
          placeholder="Nome completo do pai"
          required
        />
        <InputField
          label="Nome da Mãe"
          type="text"
          value={motherName}
          onChange={(e) => setMotherName(e.target.value)}
          placeholder="Nome completo da mãe"
          required
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 font-barlow-condensed text-xs uppercase tracking-wider hover:text-white hover:border-white/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleRegister}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-xs uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50"
          >
            {saving ? 'Inscrevendo...' : 'Confirmar Inscrição'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-sm uppercase tracking-wider font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all"
    >
      <Icon name="plus" size={16} />
      Inscrever-se
    </button>
  );
}
