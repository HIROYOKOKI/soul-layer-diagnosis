// app/layout.tsx  ← サーバーコンポーネント（"use client" は付けない）
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import ClientChrome from "@/components/ClientChrome"; // ★ パス修正（app配下ではなく共通components）

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        {/* ★ ClientChrome で children をラップ */}
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
