export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white overflow-x-hidden">
        <main className="min-h-[100dvh]">{children}</main>
      </body>
    </html>
  );
}
