'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/Modal';
import InputField from '@/components/InputField';
import Icon from '@/components/Icon';

export default function ChallengeButton({ fighterId }) {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [canChallenge, setCanChallenge] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modality, setModality] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id === fighterId) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'fighter') {
      setCurrentUserId(user.id);
      setCanChallenge(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!modality.trim()) return;

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase
      .from('challenges')
      .insert({
        challenger_id: currentUserId,
        challenged_id: fighterId,
        modality: modality.trim(),
        message: message.trim() || null,
        status: 'pending',
      });

    if (insertError) {
      setError(insertError.message || 'Erro ao enviar desafio.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
  }

  function handleClose() {
    setShowModal(false);
    setModality('');
    setMessage('');
    setError('');
    if (success) setSuccess(false);
  }

  if (!canChallenge) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-red to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all shadow-lg hover:shadow-brand-red/25"
      >
        <Icon name="swords" size={18} />
        Desafiar
      </button>

      {showModal && (
        <Modal onClose={handleClose} title="Desafiar Lutador">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} className="text-green-400" />
              </div>
              <p className="font-barlow-condensed text-xl text-white uppercase tracking-wider mb-2">
                Desafio Enviado!
              </p>
              <p className="font-barlow text-sm text-white/50">
                O lutador recebera seu desafio e podera aceitar ou recusar.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-lg bg-white/10 text-white font-barlow-condensed uppercase tracking-wider text-sm hover:bg-white/15 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Modalidade"
                name="modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                placeholder="Ex: Boxe, MMA, Jiu-Jitsu..."
                required
              />

              <InputField
                label="Mensagem (opcional)"
                name="message"
                textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Envie uma mensagem para o lutador..."
              />

              {error && (
                <p className="font-barlow text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !modality.trim()}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-red to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Icon name="send" size={16} />
                    Enviar Desafio
                  </>
                )}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
