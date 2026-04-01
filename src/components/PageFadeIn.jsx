'use client';

import { useEffect, useState } from 'react';

export default function PageFadeIn({ children, className = '' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure the transition is visible
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}
