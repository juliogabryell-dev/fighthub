'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from './Icon';
import InputField from './InputField';

export default function EventRegistrationButton({ eventId, registrationOpen, registrationTerms }) {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null); // null, 'pending', 'approved', 'rejected'
  const [showForm, setShowForm] = useState(false);
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const termsRef = useRef(null);

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

  function handleDownloadTermsPdf() {
    if (!registrationTerms) return;

    // Build a simple HTML document for printing as PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Termos e Condições</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #222; line-height: 1.6; }
    h1 { font-size: 20px; margin-bottom: 24px; color: #333; border-bottom: 2px solid #C41E3A; padding-bottom: 8px; }
    .content { white-space: pre-wrap; font-size: 14px; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Termos e Condições de Inscrição</h1>
  <div class="content">${registrationTerms.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} - FightHub</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Give the browser time to render then trigger print (save as PDF)
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  }

  async function handleRegister() {
    if (!fatherName.trim() || !motherName.trim()) {
      alert('Nome do pai e da mãe são obrigatórios para inscrição em eventos.');
      return;
    }

    if (registrationTerms && !termsAccepted) {
      alert('Você precisa aceitar os termos e condições para se inscrever.');
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

  // If registration is not open on the portal, don't render anything
  if (registrationOpen === false) return null;

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
    const hasTerms = !!registrationTerms;
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

        {/* Terms and Conditions */}
        {hasTerms && (
          <div className="space-y-2">
            {/* Collapsible terms display */}
            <button
              type="button"
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-2 w-full text-left font-barlow-condensed text-xs uppercase tracking-wider text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors"
            >
              <Icon name={showTerms ? 'chevronDown' : 'chevronRight'} size={12} />
              Termos e Condições de Inscrição
            </button>

            {showTerms && (
              <div ref={termsRef} className="bg-white/[0.03] border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="font-barlow text-xs text-white/50 leading-relaxed whitespace-pre-line">
                  {registrationTerms}
                </div>
              </div>
            )}

            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadTermsPdf}
              className="flex items-center gap-1.5 font-barlow text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <Icon name="download" size={12} />
              Baixar Termos em PDF
            </button>

            {/* Accept checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-[#C41E3A] focus:ring-[#C41E3A]"
              />
              <span className="font-barlow text-xs text-white/60 leading-relaxed">
                Li e aceito os <button type="button" onClick={() => setShowTerms(true)} className="text-[#D4AF37] underline hover:text-[#D4AF37]/80">termos e condições</button> de inscrição deste evento
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 font-barlow-condensed text-xs uppercase tracking-wider hover:text-white hover:border-white/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleRegister}
            disabled={saving || (hasTerms && !termsAccepted)}
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
