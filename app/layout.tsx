// app/layout.tsx
export const metadata = { title: 'EVΛƎ · Soul Layer' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={S.body}>{children}</body>
    </html>
  );
}

const S: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    background: '#000',
    color: '#fff',
    fontFamily:
      'ui-sans-serif, -apple-system, "SF Pro Text", "SF Pro JP", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Segoe UI, Roboto, Helvetica, Arial',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
};
