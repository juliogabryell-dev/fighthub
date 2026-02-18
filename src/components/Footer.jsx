import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Privacidade' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + Copyright */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bebas text-lg tracking-wider">
              <span className="text-white">FIGHT</span>
              <span className="text-brand-red">HUB</span>
            </span>
            <p className="text-xs text-white/25 font-barlow">
              Portal de Artes Marciais &copy; 2026
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/30 hover:text-white/60 font-barlow-condensed uppercase tracking-wider transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Tech Credit */}
          <p className="text-[10px] text-white/15 font-barlow-condensed tracking-wider">
            Desenvolvido por{' '}
            <a
              href="https://neobyte.site"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white/50 transition-colors"
            >
              NeoByte
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
