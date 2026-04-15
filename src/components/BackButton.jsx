'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Icon from './Icon';

export default function BackButton({ fallbackHref = '/', label = 'Voltar' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  return (
    <button
      onClick={() => {
        if (from) {
          router.push(from);
        } else {
          router.back();
        }
      }}
      className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
    >
      <Icon name="chevronLeft" size={16} />
      {label}
    </button>
  );
}
