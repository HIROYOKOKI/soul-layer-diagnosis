'use client';
import { usePathname } from 'next/navigation';
import AppFooter from './components/AppFooter';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith('/intro');
  return (
    <>
      <main className="min-h-dvh">{children}</main>
      {!hideFooter && <AppFooter />}
    </>
  );
}
