// app/layout.tsx  ← サーバー（"use client" は付けない）
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import ClientChrome from "./components/ClientChrome";  // ★ これを追加

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        {/* ★ ここで ClientChrome 経由にする */}
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
