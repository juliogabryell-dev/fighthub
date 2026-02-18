const COLORS = ['#C41E3A', '#D4AF37', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name) {
  if (!name) return COLORS[0];
  let code = 0;
  for (let i = 0; i < name.length; i++) {
    code += name.charCodeAt(i);
  }
  return COLORS[code % COLORS.length];
}

export default function Avatar({ name, size = 48 }) {
  const initials = getInitials(name);
  const bgColor = getColor(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bebas shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bgColor}, ${bgColor}88)`,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}
