// app/layout.tsx
import Link from 'next/link'

export const metadata = { title: 'EVΛƎ · Soul Layer' }

const HEADER_H = 64
const FOOTER_H = 64

function SiteHeader() {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <Link href="/" style={styles.brand}>EVΛƎ</Link>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>Home</a>
          <a href="/daily" style={styles.navLink}>Daily</a>
          <a href="/weekly" style={styles.navLink}>Weekly</a>
          <a href="/monthly" style={styles.navLink}>Monthly</a>
          <a href="/mypage" style={styles.navLinkStrong}>MyPage</a>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <span>© {new Date().getFullYear()} EVΛƎ Project</span>
        <nav style={{ display: 'flex', gap: 16 }}>
          <a href="/profile" style={styles.footerLink}>プロフィール</a>
          <a href="/register" style={styles.footerLink}>登録</a>
          <a href="/login/form" style={styles.footerLink}>ログイン</a>
        </nav>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={styles.body}>
        <SiteHeader />
        <main style={styles.main}>{children}</main>
        <SiteFooter />
        <style>{globalCss}</style>
      </body>
    </html>
  )
}

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
    height: HEADER_H,
    backdropFilter: 'blur(10px)',
    background: 'rgba(6,7,10,.55)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
  },
  headerInner: {
    maxWidth: 980,
    margin: '0 auto',
    height: '100%',
    padding: '0 max(14px, env(safe-area-inset-left))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontWeight: 800, letterSpacing: '.08em', textDecoration: 'none', color: '#fff' },
  nav: { display: 'flex', gap: 14, alignItems: 'center', overflowX: 'auto' },
  navLink: { color: '#cfe2ff', textDecoration: 'none', fontSize: 14, opacity: 0.9, whiteSpace: 'nowrap' },
  navLinkStrong: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    padding: '6px 10px',
    border: '1px solid rgba(255,255,255,.18)',
    borderRadius: 9999,
    background: 'rgba(255,255,255,.06)',
    whiteSpace: 'nowrap',
  },
  main: {
    minHeight: `calc(100dvh - ${HEADER_H}px - ${FOOTER_H}px)`,
    padding: `12px max(14px, env(safe-area-inset-left)) 20px`,
    borderTop: '1px solid rgba(255,255,255,.04)',
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    zIndex: 40,
    height: FOOTER_H,
    backdropFilter: 'blur(10px)',
    background: 'rgba(6,7,10,.55)',
    borderTop: '1px solid rgba(255,255,255,.08)',
  },
  footerInner: {
    maxWidth: 980,
    margin: '0 auto',
    height: '100%',
    padding: '0 max(14px, env(safe-area-inset-left)) env(safe-area-inset-bottom)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    opacity: 0.9,
  },
  footerLink: { color: '#cfe2ff', textDecoration: 'none' },
}

const globalCss = `
  input, select, button { font-size: 16px; }
  a { -webkit-tap-highlight-color: transparent; }
`
