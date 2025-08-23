// app/layout.tsx
import Link from 'next/link';

export const metadata = { title: 'EVΛƎ · Soul Layer' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={styles.body}>
        <SiteHeader />
        <main style={styles.main}>{children}</main>
        <SiteFooter />
        <style>{globalCss}</style>
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <Link href="/" style={styles.brand}>EVΛƎ</Link>
        <nav style={styles.nav}>
          <Link href="/" style={styles.navLink}>Home</Link>
          <Link href="/daily" style={styles.navLink}>Daily</Link>
          <Link href="/weekly" style={styles.navLink}>Weekly</Link>
          <Link href="/monthly" style={styles.navLink}>Monthly</Link>
          <Link href="/mypage" style={styles.navLinkStrong}>MyPage</Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <span>© {new Date().getFullYear()} EVΛƎ Project</span>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link href="/profile" style={styles.footerLink}>プロフィール</Link>
          <Link href="/register" style={styles.footerLink}>登録</Link>
          <Link href="/login/form" style={styles.footerLink}>ログイン</Link>
          {/* 外部リンクは <a> のままでOK（例） */}
          {/* <a href="https://x.com/..." target="_blank" rel="noreferrer" style={styles.footerLink}>X</a> */}
        </nav>
      </div>
    </footer>
  );
}

/* ===== styles & global CSS ===== */
const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    background: '#000',
    color: '#fff',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    height: '56px',
    backdropFilter: 'blur(8px)',
    background: 'rgba(0,0,0,.55)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
  },
  headerInner: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '0 max(12px, env(safe-area-inset-left))',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontWeight: 800, letterSpacing: '.08em', textDecoration: 'none', color: '#fff' },
  nav: { display: 'flex', gap: 14, alignItems: 'center' },
  navLink: { color: '#cfe2ff', textDecoration: 'none', fontSize: 14, opacity: .9 },
  navLinkStrong: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    padding: '6px 10px',
    border: '1px solid rgba(255,255,255,.18)',
    borderRadius: 9999,
    background: 'rgba(255,255,255,.06)',
  },
  main: { minHeight: 'calc(100dvh - 56px - 56px)', padding: '20px max(14px, env(safe-area-inset-left))' },
  footer: {
    position: 'sticky',
    bottom: 0,
    zIndex: 40,
    height: '56px',
    backdropFilter: 'blur(8px)',
    background: 'rgba(0,0,0,.55)',
    borderTop: '1px solid rgba(255,255,255,.08)',
  },
  footerInner: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '0 max(12px, env(safe-area-inset-left))',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    opacity: .9,
  },
  footerLink: { color: '#cfe2ff', textDecoration: 'none' },
};

const globalCss = `
  input, select, button { font-size: 16px; }
  a { -webkit-tap-highlight-color: transparent; }
`;
