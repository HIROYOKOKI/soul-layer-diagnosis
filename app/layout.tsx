// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import { usePathname } from "next/navigation";

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith("/login"); 
  // 👆 /login 配下ならヘッダーを隠す

  return (
    <html lang="ja">
      <body className="bg-black text-white overflow-x-hidden">
        {!hideHeader && <AppHeader />}  {/* ← 条件付き表示 */}
        <main className="min-h-[100dvh]">{children}</main>
      </body>
    </html>
  );
}
