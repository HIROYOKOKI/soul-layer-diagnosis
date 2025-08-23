// 変更点だけ：styles と <head> 追加（頭の <html> 直下に）
// ...
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
  );
}

const HEADER_H = 64;   // ↑ 56→64 に
const FOOTER_H = 64;

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
  // ...
  main: {
    minHeight: `calc(100dvh - ${HEADER_H}px - ${FOOTER_H}px)`,
    padding: `12px max(14px, env(safe-area-inset-left)) 20px`,
    // ヘッダーの下に余白ライン
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
    opacity: .9,
  },
};
const globalCss = `
  /* iOSのフォーム勝手ズーム防止 */
  input, select, button { font-size: 16px; }
  a { -webkit-tap-highlight-color: transparent; }
`;
