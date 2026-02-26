'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/Icon';

export default function RequestAcademyBindingButton({ academyId }) {
  const [state, setState] = useState('loading'); // 'loading', 'hidden', 'show'
  const [martialArts, setMartialArts] = useState([]);
  const [bindings, setBindings] = useState([]);
  const [academyCounts, setAcademyCounts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    checkBindingStatus();
  }, [academyId]);

  async function checkBindingStatus() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState('hidden');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_fighter')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_fighter || user.id === academyId) {
        setState('hidden');
        return;
      }

      // Fetch fighter's martial arts
      const { data: arts } = await supabase
        .from('fighter_martial_arts')
        .select('id, art_name')
        .eq('fighter_id', user.id);
      setMartialArts(arts || []);

      if (!arts || arts.length === 0) {
        setState('hidden');
        return;
      }

      // Fetch existing bindings with this academy
      const { data: existingBindings } = await supabase
        .from('fighter_academies')
        .select('id, martial_art_id, status')
        .eq('fighter_id', user.id)
        .eq('academy_id', academyId);
      setBindings(existingBindings || []);

      // Fetch all academy bindings per modality to check limits
      const { data: allAcademyBindings } = await supabase
        .from('fighter_academies')
        .select('martial_art_id')
        .eq('fighter_id', user.id)
        .in('status', ['pending', 'active']);

      const counts = {};
      (allAcademyBindings || []).forEach(b => {
        counts[b.martial_art_id] = (counts[b.martial_art_id] || 0) + 1;
      });
      setAcademyCounts(counts);

      setState('show');
    } catch {
      setState('hidden');
    }
  }

  async function handleRequest(artId) {
    setSubmitting(artId);
    setFeedback('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setFeedback('Você precisa estar logado.');
        setSubmitting(null);
        return;
      }

      const { error } = await supabase
        .from('fighter_academies')
        .insert({
          fighter_id: user.id,
          academy_id: academyId,
          martial_art_id: artId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          setFeedback('Solicitação já enviada para esta modalidade.');
        } else {
          setFeedback('Erro ao enviar solicitação. Tente novamente.');
        }
        setSubmitting(null);
        return;
      }

      setFeedback('Solicitação enviada com sucesso!');
      await checkBindingStatus();
    } catch {
      setFeedback('Erro inesperado. Tente novamente.');
    }

    setSubmitting(null);
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

  const statusStyles = {
    active: 'bg-green-500/10 border-green-500/30 text-green-400',
    pending: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  const statusLabels = {
    active: 'Vinculado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
  };

  return (
    <div className="w-full">
      <p className="font-barlow-condensed text-xs uppercase tracking-widest text-white/40 mb-3 text-center">
        Solicitar Vínculo por Modalidade
      </p>
      <div className="space-y-2">
        {martialArts.map((art) => {
          const binding = bindings.find(b => b.martial_art_id === art.id);
          const count = academyCounts[art.id] || 0;
          const limitReached = count >= 2 && !binding;

          return (
            <div
              key={art.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]"
            >
              <span className="font-barlow-condensed text-sm text-white">
                {art.art_name}
              </span>
              {binding ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider border ${statusStyles[binding.status]}`}>
                  {binding.status === 'active' && <Icon name="check" size={12} />}
                  {binding.status === 'pending' && <Icon name="clock" size={12} />}
                  {binding.status === 'rejected' && <Icon name="x" size={12} />}
                  {statusLabels[binding.status]}
                </span>
              ) : limitReached ? (
                <span className="text-xs font-barlow-condensed text-white/30 uppercase tracking-wider">
                  Limite atingido
                </span>
              ) : (
                <button
                  onClick={() => handleRequest(art.id)}
                  disabled={submitting === art.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-barlow-condensed uppercase tracking-widest text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting === art.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                  ) : (
                    <Icon name="send" size={12} />
                  )}
                  Solicitar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {feedback && (
        <p className={`font-barlow text-xs mt-2 text-center ${feedback.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
