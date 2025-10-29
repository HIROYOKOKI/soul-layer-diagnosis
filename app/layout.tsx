// app/layout.tsx
'use client';

import "./globals.css";
import { usePathname } from "next/navigation";
import AuthSync from "@/components/AuthSync";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith("/intro"); // INTRO配下はフッター非表示

  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        {/* stickyヘッダー/フッターはフロー上にあるので余白は不要 */}
        <main className="min-h-dvh">{children}</main>
        {!hideFooter && <AppFooter />}
      </body>
    </html>
  );
}
