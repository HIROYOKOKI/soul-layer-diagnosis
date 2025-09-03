// app/components/AppHeader.tsx
"use client"

import Image from "next/image"
import { Settings } from "lucide-react"
import { usePathname } from "next/navigation"

export default function AppHeader() {
  const pathname = usePathname()
  // /mypage または /mypage/... のとき true
  const isMyPage = pathname?.startsWith("/mypage")

  return (
    <header className="flex items-center justify-between px-5 py-3">
      {/* 左：ロゴ + ブランド名 */}
      <div className="flex items-center gap-3">
        <Image
          src="/icon-512.png"
          alt="Soul Layer Logo"
          width={28}
          height={28}
          priority
          className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
        />
        <span className="text-sm tracking-[0.25em] text-white/70">
          SOUL LAYER DIAGNOSIS
        </span>
      </div>

      {/* 右：FREEは常時、⚙️は /mypage 配下のみ */}
      <div className="flex items-center gap-2">
        <span className="free-badge px-3 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-white/80">
          FREE
        </span>

        {isMyPage && (
          <button
            aria-label="Settings"
            className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            <Settings
              className="w-5 h-5 text-sky-400 [stroke-width:1.05] drop-shadow-[0_0_6px_rgba(56,189,248,0.85)]"
              strokeWidth={1.05}
            />
          </button>
        )}
      </div>
    </header>
  )
}
