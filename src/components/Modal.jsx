'use client';

import Icon from './Icon';

export default function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`${maxWidth} w-full bg-gradient-to-b from-dark-card to-dark-card2 rounded-2xl p-6 border border-brand-red/30 relative max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <Icon name="x" size={20} />
        </button>

        {/* Title */}
        {title && (
          <h2 className="font-bebas text-3xl text-white tracking-wider mb-4 pr-8">
            {title}
          </h2>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
