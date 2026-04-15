'use client';

import { useRouter } from 'next/navigation';
import Icon from './Icon';

export default function BackButton({ fallbackHref = '/', label = 'Voltar' }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
    >
      <Icon name="chevronLeft" size={16} />
      {label}
    </button>
  );
}
