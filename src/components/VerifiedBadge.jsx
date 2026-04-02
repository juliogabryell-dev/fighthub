export default function VerifiedBadge({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block flex-shrink-0 ${className}`}
      title="Verificado"
    >
      <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
      <path d="M8.5 12.5l2 2 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
