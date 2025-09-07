// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import AppHeader from "@/app/components/AppHeader"

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="overflow-x-hidden">
      <body className="bg-black text-white overflow-x-hidden">
        {/* ヘッダーはここで1回だけ */}
        <AppHeader />
        <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
