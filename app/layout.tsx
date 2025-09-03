// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import AppHeader from "@/components/AppHeader"  // ← aliasでcomponentsを参照

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white overflow-x-hidden">
        {/* ヘッダーはここで1回だけ */}
        <AppHeader />
        <main className="min-h-[100dvh]">{children}</main>
      </body>
    </html>
  )
}
