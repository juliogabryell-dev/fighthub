'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

export const FIGHT_RESULT_LABELS = {
  win: 'Vitória',
  loss: 'Derrota',
  draw: 'Empate',
  no_contest: 'NC',
};

const RESULT_STYLES = {
  win: 'bg-green-500/10 border-green-500/30 text-green-400',
  loss: 'bg-red-500/10 border-red-500/30 text-red-400',
  draw: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
  no_contest: 'bg-theme-text/5 border-theme-border/20 text-theme-text/50',
};

export const VALIDATION_SEALS = {
  pending: { label: 'Aguardando validação', icon: 'clock', className: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' },
  validated: { label: 'Validado', icon: 'check', className: 'bg-[#1D9BF0]/10 border-[#1D9BF0]/30 text-[#1D9BF0]' },
  rejected: { label: 'Não validado', icon: 'x', className: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

export function ValidationSeal({ status }) {
  const seal = VALIDATION_SEALS[status] || VALIDATION_SEALS.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider shrink-0 ${seal.className}`}>
      <Icon name={seal.icon} size={10} />
      {seal.label}
    </span>
  );
}

const CATEGORY_LABELS = {
  profissional: 'Profissional',
  semi_profissional: 'Semi-Profissional',
  amador: 'Amador',
};

export default function FightExperienceCard({ fight, actions = null, pending = false, showNote = true }) {
  const [zoomUrl, setZoomUrl] = useState(null);
  const photos = [
    { url: fight.faceoff_photo_url, label: 'Encarada' },
    { url: fight.hand_raised_photo_url, label: 'Resultado' },
    { url: fight.event_poster_url, label: 'Cartaz' },
  ].filter((p) => p.url);

  return (
    <div
      className={`bg-gradient-to-br from-dark-card to-dark-card2 rounded-xl border overflow-hidden ${
        pending ? 'border-[#D4AF37]/20 opacity-70' : 'border-theme-border/10'
      }`}
    >
      {photos.length > 0 && (
        <div className={`grid ${photos.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-px bg-theme-border/10`}>
          {photos.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setZoomUrl(p.url)}
              className="relative aspect-[4/3] bg-dark-card overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 font-barlow-condensed text-[10px] uppercase tracking-wider text-white">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider ${RESULT_STYLES[fight.result] || RESULT_STYLES.no_contest}`}>
                {FIGHT_RESULT_LABELS[fight.result] || fight.result}
              </span>
              <p className="font-barlow-condensed text-theme-text font-semibold truncate">
                vs {fight.opponent_name}
              </p>
              {pending ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-barlow-condensed uppercase tracking-wider bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                  Aguardando Aprovação
                </span>
              ) : (
                <ValidationSeal status={fight.validation_status} />
              )}
            </div>
            <p className="font-barlow text-theme-text/40 text-xs mt-1">
              {[fight.modality, CATEGORY_LABELS[fight.category], fight.event_name, fight.fight_date && new Date(fight.fight_date + 'T00:00:00').toLocaleDateString('pt-BR')]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {showNote && fight.validation_status === 'rejected' && fight.validation_note && (
              <p className="font-barlow text-xs text-red-400/80 mt-1">
                Motivo: {fight.validation_note}
              </p>
            )}
            {fight.video_url && (
              <a
                href={fight.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-barlow text-[#C41E3A] text-sm hover:underline mt-1 inline-flex items-center gap-1"
              >
                <Icon name="play" size={12} /> Assistir à luta
              </a>
            )}
          </div>
          {actions}
        </div>
      </div>

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomUrl} alt="Foto da luta" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function FightPhotoInput({ label, file, currentUrl, onChange, onRemove }) {
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;
  return (
    <div>
      <label className="block uppercase text-xs tracking-wider text-theme-text/50 font-barlow-condensed font-semibold mb-1.5">
        {label}
      </label>
      <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-theme-border/20 hover:border-[#C41E3A]/40 cursor-pointer transition-colors">
        <div className="w-16 h-16 rounded-lg bg-theme-text/5 overflow-hidden flex items-center justify-center shrink-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="camera" size={20} className="text-theme-text/30" />
          )}
        </div>
        <span className="font-barlow text-sm text-theme-text/50">
          {file ? file.name : previewUrl ? 'Trocar foto' : 'Selecionar foto'}
        </span>
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
      {onRemove && previewUrl && (
        <button type="button" onClick={onRemove} className="mt-1 font-barlow text-xs text-theme-text/40 hover:text-red-400 transition-colors">
          Remover foto
        </button>
      )}
    </div>
  );
}
