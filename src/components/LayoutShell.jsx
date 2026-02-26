'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isFullAdmin = pathname.startsWith('/fulladmin');

  if (isFullAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-20">{children}</div>
      <Footer />
    </>
  );
}
