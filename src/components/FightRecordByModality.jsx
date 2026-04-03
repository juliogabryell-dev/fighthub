'use client';

import { useState } from 'react';

const CATEGORIES = [
  { key: 'profissional', label: 'Profissional' },
  { key: 'semi_profissional', label: 'Semi Pro' },
  { key: 'amador', label: 'Amador' },
];

function aggregate(records, modality, category) {
  const filtered = records.filter((r) => r.modality === modality && (r.category || 'amador') === category);
  return {
    wins: filtered.reduce((s, r) => s + (r.wins || 0), 0),
    losses: filtered.reduce((s, r) => s + (r.losses || 0), 0),
    draws: filtered.reduce((s, r) => s + (r.draws || 0), 0),
    no_contest: filtered.reduce((s, r) => s + (r.no_contest || 0), 0),
    hasData: filtered.some((r) => (r.wins || 0) + (r.losses || 0) + (r.draws || 0) + (r.no_contest || 0) > 0),
  };
}

function getDefaultCategory(records, modality) {
  for (const cat of CATEGORIES) {
    if (aggregate(records, modality, cat.key).hasData) return cat.key;
  }
  return 'amador';
}

export default function FightRecordByModality({ records = [], modalities = [] }) {
  const [activeCats, setActiveCats] = useState({});

  // Get modalities that have fight records
  const modalityNames = [...new Set(records.map((r) => r.modality))];
  // Merge with martial arts names
  const allModalities = [...new Set([...modalities.map((m) => m.art_name), ...modalityNames])];

  if (allModalities.length === 0) return null;

  return (
    <div className="space-y-4">
      {allModalities.map((mod) => {
        const activeCat = activeCats[mod] || getDefaultCategory(records, mod);
        const current = aggregate(records, mod, activeCat);
        const hasAnyData = CATEGORIES.some((c) => aggregate(records, mod, c.key).hasData);

        if (!hasAnyData) return null;

        return (
          <div key={mod} className="bg-theme-text/[0.02] rounded-lg border border-theme-border/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-barlow-condensed text-theme-text font-semibold uppercase tracking-wider text-sm">{mod}</h4>
              <div className="flex gap-1">
                {CATEGORIES.map((cat) => {
                  const catData = aggregate(records, mod, cat.key);
                  const isActive = activeCat === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCats({ ...activeCats, [mod]: cat.key })}
                      className={`px-2 py-0.5 rounded text-[9px] font-barlow-condensed uppercase tracking-wider border transition-all ${
                        isActive
                          ? 'bg-[#C41E3A]/15 border-[#C41E3A]/30 text-[#C41E3A]'
                          : catData.hasData
                            ? 'bg-theme-text/5 border-theme-border/10 text-theme-text/40 hover:text-theme-text/60'
                            : 'bg-transparent border-theme-border/5 text-theme-text/15'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="font-bebas text-lg text-green-500">{current.wins}</p>
                <p className="font-barlow-condensed text-[9px] text-theme-text/40 uppercase tracking-widest">Vitórias</p>
              </div>
              <div className="text-center p-2 bg-[#C41E3A]/10 rounded-lg border border-[#C41E3A]/20">
                <p className="font-bebas text-lg text-[#C41E3A]">{current.losses}</p>
                <p className="font-barlow-condensed text-[9px] text-theme-text/40 uppercase tracking-widest">Derrotas</p>
              </div>
              <div className="text-center p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                <p className="font-bebas text-lg text-[#D4AF37]">{current.draws}</p>
                <p className="font-barlow-condensed text-[9px] text-theme-text/40 uppercase tracking-widest">Empates</p>
              </div>
              <div className="text-center p-2 bg-theme-text/5 rounded-lg border border-theme-border/10">
                <p className="font-bebas text-lg text-theme-text/40">{current.no_contest}</p>
                <p className="font-barlow-condensed text-[9px] text-theme-text/30 uppercase tracking-widest">No Contest</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
