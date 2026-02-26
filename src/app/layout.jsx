import { Bebas_Neue, Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const barlow = Barlow({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export const metadata = {
  title: 'FightLog - Portal de Modalidades',
  description:
    'Plataforma completa para lutadores e treinadores. Cadastre seu perfil, registre seu cartel e conecte-se com a comunidade.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${bebasNeue.variable} ${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body className="bg-dark-bg min-h-screen text-white">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
