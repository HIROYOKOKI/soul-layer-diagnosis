// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import AppHeader from "./components/AppHeader"  // ← これを使う

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">
        <AppHeader />   {/* ← ここで1回だけ描画 */}
        {/* ここにもう一段のヘッダーやFREEピルを置かない */}
        {children}
      </body>
    </html>
  )
}
