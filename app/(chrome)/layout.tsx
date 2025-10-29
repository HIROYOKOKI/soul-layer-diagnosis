// app/(chrome)/layout.tsx
'use client';

import Link from 'next/link';
import React from 'react';

const HEADER_H = 56;
const FOOTER_H = 52;

export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link href="/" style={S.brand}>
            EVΛƎ
          </Link>
          <nav style={S.nav}>
            <Link href="/daily" style={S.navLink}>Daily</Link>
            <Link href="/weekly" style={S.navLink}>Weekly</Link>
            <Link href="/monthly" style={S.navLink}>Monthly</Link>
            <Link href="/mypage" style={S.navLinkStrong}>MyPage</Link>
          </nav>
        </div>
      </header>

      <main style={S.main}>{children}</main>

      <footer style={S.footer}>
        <div style={S.footerInner}>
          <span style={{ opacity: 0.7, color: '#e6e6e6' }}>
            © {new Date().getFullYear()} EVΛƎ Project
          </span>
          <nav style={S.footerNav}>
            <Link href="/profile" style={S.footLink}>プロフィール</Link>
            <Link href="/register" style={S.footLink}>登録</Link>
            <Link href="/login" style={S.footLink}>ログイン</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

type CSS = React.CSSProperties & { WebkitBackdropFilter?: string };

const S: Record<string, CSS> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    height: HEADER_H,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    background: 'rgba(6,7,10,.55)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
  },
  headerInner: {
    maxWidth: 980,
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // safe-area
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
  },
  brand: {
    textDecoration: 'none',
    color: '#fff',
    fontWeight: 700,
    letterSpacing: '.06em',
  },
  nav: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    overflowX: 'auto',
  },
  navLink: {
    textDecoration: 'none',
    color: '#cfe2ff',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  navLinkStrong: {
    textDecoration: 'none',
    color: '#fff',
    fontSize: 14,
    whiteSpace: 'nowrap',
    padding: '6px 10px',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.18)',
    background: 'rgba(255,255,255,.06)',
  },
  main: {
    // 画面高からヘッダー/フッターを差し引いて最低高を確保
    minHeight: `calc(100dvh - ${HEADER_H}px - ${FOOTER_H}px)`,
    paddingTop: 20,
    paddingBottom: 24,
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    zIndex: 40,
    height: FOOTER_H,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    background: 'rgba(6,7,10,.55)',
    borderTop: '1px solid rgba(255,255,255,.08)',
  },
  footerInner: {
    maxWidth: 980,
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    // safe-area
    paddingTop: 0,
    paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
    color: '#e6e6e6',
  },
  footerNav: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  },
  footLink: {
    textDecoration: 'none',
    color: '#cfe2ff',
  },
};
