// app/(chrome)/layout.tsx
'use client'
import Link from 'next/link'

const HEADER_H = 56
const FOOTER_H = 52

export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link href="/" style={S.brand}>EVΛƎ</Link>
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
          <span style={{opacity:.7}}>© {new Date().getFullYear()} EVΛƎ Project</span>
          <nav style={{display:'flex',gap:16}}>
            <Link href="/profile" style={S.footLink}>プロフィール</Link>
            <Link href="/register" style={S.footLink}>登録</Link>
            <Link href="/login" style={S.footLink}>ログイン</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  header: {
    position:'sticky', top:0, zIndex:50, height:HEADER_H,
    backdropFilter:'blur(10px)', background:'rgba(6,7,10,.55)',
    borderBottom:'1px solid rgba(255,255,255,.08)'
  },
  headerInner:{
    maxWidth:980, margin:'0 auto', height:'100%',
    padding:'0 max(16px, env(safe-area-inset-left))',
    display:'flex', alignItems:'center', justifyContent:'space-between'
  },
  brand:{ textDecoration:'none', color:'#fff', fontWeight:700, letterSpacing:'.06em' },
  nav:{ display:'flex', gap:14, alignItems:'center', overflowX:'auto' },
  navLink:{ textDecoration:'none', color:'#cfe2ff', fontSize:14, whiteSpace:'nowrap' },
  navLinkStrong:{
    textDecoration:'none', color:'#fff', fontSize:14, whiteSpace:'nowrap',
    padding:'6px 10px', borderRadius:9999,
    border:'1px solid rgba(255,255,255,.18)', background:'rgba(255,255,255,.06)'
  },
  main: {
    minHeight: `calc(100dvh - ${HEADER_H}px - ${FOOTER_H}px)`,
    padding: `20px max(16px, env(safe-area-inset-left)) 24px`,
  },
  footer:{
    position:'sticky', bottom:0, zIndex:40, height:FOOTER_H,
    backdropFilter:'blur(10px)', background:'rgba(6,7,10,.55)',
    borderTop:'1px solid rgba(255,255,255,.08)'
  },
  footerInner:{
    maxWidth:980, margin:'0 auto', height:'100%',
    padding:'0 max(16px, env(safe-area-inset-left)) env(safe-area-inset-bottom)',
    display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13
  },
  footLink:{ textDecoration:'none', color:'#cfe2ff' },
}
