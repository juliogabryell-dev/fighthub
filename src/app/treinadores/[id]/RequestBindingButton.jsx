'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/Icon';

export default function RequestBindingButton({ coachId }) {
  // States: 'loading', 'hidden', 'none', 'pending', 'active', 'rejected'
  const [state, setState] = useState('loading');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkBindingStatus();
  }, [coachId]);

  async function checkBindingStatus() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState('hidden');
        return;
      }

      // Check if user is a fighter and not the coach themselves
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'fighter' || user.id === coachId) {
        setState('hidden');
        return;
      }

      // Check if binding already exists
      const { data: binding } = await supabase
        .from('fighter_coaches')
        .select('status')
        .eq('fighter_id', user.id)
        .eq('coach_id', coachId)
        .single();

      if (binding) {
        setState(binding.status);
      } else {
        setState('none');
      }
    } catch {
      setState('hidden');
    }
  }

  async function handleRequest() {
    setSubmitting(true);
    setFeedback('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setFeedback('Você precisa estar logado.');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('fighter_coaches')
        .insert({
          fighter_id: user.id,
          coach_id: coachId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          setFeedback('Solicitação já enviada.');
          setState('pending');
        } else {
          setFeedback('Erro ao enviar solicitação. Tente novamente.');
        }
        setSubmitting(false);
        return;
      }

      setState('pending');
      setFeedback('Solicitação enviada com sucesso!');
    } catch {
      setFeedback('Erro inesperado. Tente novamente.');
    }

    setSubmitting(false);
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-white/30">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'hidden') {
    return null;
  }

  if (state === 'active') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
        <Icon name="check" size={16} />
        <span className="font-barlow-condensed text-sm text-green-400 uppercase tracking-wider font-semibold">
          Vinculado
        </span>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold/10 border border-brand-gold/30">
          <Icon name="clock" size={16} />
          <span className="font-barlow-condensed text-sm text-brand-gold uppercase tracking-wider font-semibold">
            Solicitação Pendente
          </span>
        </div>
        {feedback && (
          <p className="font-barlow text-xs text-green-400 mt-2">{feedback}</p>
        )}
      </div>
    );
  }

  if (state === 'rejected') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
        <Icon name="x" size={16} />
        <span className="font-barlow-condensed text-sm text-red-400 uppercase tracking-wider font-semibold">
          Solicitação Rejeitada
        </span>
      </div>
    );
  }

  // state === 'none'
  return (
    <div>
      <button
        onClick={handleRequest}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-yellow-600 text-black font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:shadow-lg hover:shadow-brand-gold/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-black/30 border-t-black/70 rounded-full animate-spin" />
        ) : (
          <Icon name="send" size={16} />
        )}
        Solicitar Vínculo
      </button>
      {feedback && (
        <p className="font-barlow text-xs text-red-400 mt-2">{feedback}</p>
      )}
    </div>
  );
}
