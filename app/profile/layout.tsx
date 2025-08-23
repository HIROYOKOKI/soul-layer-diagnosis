// app/profile/layout.tsx
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={styles.body}>
        <main style={styles.main}>{children}</main>
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
  main: {
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}

const globalCss = `
  input, select, button { font-size: 16px; }
  a { -webkit-tap-highlight-color: transparent; }
`
