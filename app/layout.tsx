// app/layout.tsx
import type { Metadata } from "next";
import './globals.css';            // ←これが無いと全部効かない！

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      {/* bodyにクラスで配色を指定（インラインstyleは全部撤去） */}
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
