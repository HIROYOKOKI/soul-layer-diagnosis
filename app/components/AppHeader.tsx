"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

export default function AppHeader() {
  const pathname = usePathname() || ""
  // const isMyPage = /^\/mypage(?:\/|$)/.test(pathname) // ← 使うなら残す

  return (
    <header className="relative z-50 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <Image src="/icon-512.png" alt="Soul Layer Logo" width={32} height={32} priority className="rounded-full" />
        <span className="tracking-[0.28em] text-xs md:text-sm text-white/90">SOUL LAYER DIAGNOSIS</span>
      </div>
      {/* 右側は空（設定は /mypage 本体で表示） */}
      <div className="w-6 h-6" />
    </header>
  )
}
