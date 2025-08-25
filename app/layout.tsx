// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      {/* data-mode はクライアントで書き換える */}
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
