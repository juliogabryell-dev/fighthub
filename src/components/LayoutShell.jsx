'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import PageFadeIn from './PageFadeIn';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isFullAdmin = pathname.startsWith('/fulladmin');
  const isAdmin = pathname.startsWith('/admin');
  const isAuth = pathname.startsWith('/auth');

  if (isFullAdmin) {
    return <>{children}</>;
  }

  const skipFadeIn = isAdmin || isAuth;

  return (
    <>
      <Navbar />
      <div className="pt-20">
        {skipFadeIn ? children : (
          <PageFadeIn key={pathname}>
            {children}
          </PageFadeIn>
        )}
      </div>
      <Footer />
    </>
  );
}
