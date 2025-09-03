// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import { Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ ソウルレイヤー診断",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">
        {/* ===== Header: 単一構成 ===== */}
        <header className="flex items-center justify-between px-5 py-3">
          {/* 左：ブランドライン（1行のみ） */}
          <div className="flex items-center gap-3">
            {/* もし丸いロゴ画像を使っていたら下の1行だけ残す/使う */}
            {/* <Image src="/logo.svg" alt="" width={20} height={20} className="opacity-90" /> */}
            <span className="text-sm tracking-[0.25em] opacity-70">SOUL LAYER DIAGNOSIS</span>
          </div>

          {/* 右：FREEバッジ + 設定（FREEは1個だけ） */}
          <div className="flex items-center gap-2">
            <span className="free-badge select-none rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              FREE
            </span>
            <button
              aria-label="Settings"
              className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <Settings className="w-5 h-5 text-sky-400 [stroke-width:1.1]" strokeWidth={1.1} />
            </button>
          </div>
        </header>

        {/* ↓↓↓ ここに“もう一段のブランド行／FREE”を置かないこと！ ↓↓↓ */}
        {/* 重複の原因：二段目のロゴ＋テキスト行 or もう1個のFREEバッジ */}

        {children}
      </body>
    </html>
  )
}
