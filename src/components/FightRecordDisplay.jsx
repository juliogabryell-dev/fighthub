'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = [
  { key: 'profissional', label: 'Profissional' },
  { key: 'semi_profissional', label: 'Semi Pro' },
  { key: 'amador', label: 'Amador' },
];

function aggregate(records, category) {
  const filtered = records.filter((r) => (r.category || 'amador') === category);
  return {
    wins: filtered.reduce((s, r) => s + (r.wins || 0), 0),
    losses: filtered.reduce((s, r) => s + (r.losses || 0), 0),
    draws: filtered.reduce((s, r) => s + (r.draws || 0), 0),
    no_contest: filtered.reduce((s, r) => s + (r.no_contest || 0), 0),
    hasData: filtered.some((r) => (r.wins || 0) + (r.losses || 0) + (r.draws || 0) + (r.no_contest || 0) > 0),
  };
}

function getDefaultCategory(records) {
  for (const cat of CATEGORIES) {
    if (aggregate(records, cat.key).hasData) return cat.key;
  }
  return 'amador';
}

export default function FightRecordDisplay({ records = [], size = 'md' }) {
  const [activeCategory, setActiveCategory] = useState('amador');

  useEffect(() => {
    setActiveCategory(getDefaultCategory(records));
  }, [records]);

  const current = aggregate(records, activeCategory);

  const s = {
    sm: { num: 'text-lg', label: 'text-[9px]', pad: 'p-2', gap: 'gap-2', tabText: 'text-[9px]', tabPad: 'px-2 py-1' },
    md: { num: 'text-2xl', label: 'text-[10px]', pad: 'p-3', gap: 'gap-2', tabText: 'text-[10px]', tabPad: 'px-3 py-1.5' },
    lg: { num: 'text-3xl', label: 'text-xs', pad: 'p-5', gap: 'gap-3', tabText: 'text-xs', tabPad: 'px-4 py-2' },
  }[size] || { num: 'text-2xl', label: 'text-[10px]', pad: 'p-3', gap: 'gap-2', tabText: 'text-[10px]', tabPad: 'px-3 py-1.5' };

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {CATEGORIES.map((cat) => {
          const catData = aggregate(records, cat.key);
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`${s.tabPad} rounded-lg font-barlow-condensed ${s.tabText} uppercase tracking-wider transition-all border ${
                isActive
                  ? 'bg-[#C41E3A]/15 border-[#C41E3A]/30 text-[#C41E3A]'
                  : catData.hasData
                    ? 'bg-theme-text/5 border-theme-border/10 text-theme-text/50 hover:text-theme-text/70'
                    : 'bg-transparent border-theme-border/5 text-theme-text/20'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-4 ${s.gap}`}>
        <div className={`text-center ${s.pad} bg-green-500/10 rounded-xl border border-green-500/20`}>
          <p className={`font-bebas ${s.num} text-green-500`}>{current.wins}</p>
          <p className={`font-barlow-condensed ${s.label} text-theme-text/40 uppercase tracking-widest mt-1`}>Vitórias</p>
        </div>
        <div className={`text-center ${s.pad} bg-[#C41E3A]/10 rounded-xl border border-[#C41E3A]/20`}>
          <p className={`font-bebas ${s.num} text-[#C41E3A]`}>{current.losses}</p>
          <p className={`font-barlow-condensed ${s.label} text-theme-text/40 uppercase tracking-widest mt-1`}>Derrotas</p>
        </div>
        <div className={`text-center ${s.pad} bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20`}>
          <p className={`font-bebas ${s.num} text-[#D4AF37]`}>{current.draws}</p>
          <p className={`font-barlow-condensed ${s.label} text-theme-text/40 uppercase tracking-widest mt-1`}>Empates</p>
        </div>
        <div className={`text-center ${s.pad} bg-theme-text/5 rounded-xl border border-theme-border/10`}>
          <p className={`font-bebas ${s.num} text-theme-text/40`}>{current.no_contest}</p>
          <p className={`font-barlow-condensed ${s.label} text-theme-text/30 uppercase tracking-widest mt-1`}>No Contest</p>
        </div>
      </div>
    </div>
  );
}
