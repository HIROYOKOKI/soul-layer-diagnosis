// app/layout.tsx
import "./globals.css"
import { Settings } from "lucide-react"   // 追加
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">
        <header className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm tracking-widest opacity-70">SOUL LAYER DIAGNOSIS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="select-none rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              FREE
            </span>
            <button
              aria-label="Settings"
              className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <Settings
                className="text-sky-400"
                size={20}          // アイコンサイズ
                strokeWidth={1.15} // 線の太さを細く
              />
            </button>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
