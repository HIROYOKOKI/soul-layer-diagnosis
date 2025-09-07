"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

export default function AppHeader() {
  const pathname = usePathname() || ""
  // const isMyPage = /^\/mypage(?:\/|$)/.test(pathname)

  return (
    <header className="relative z-50 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-512.png"
          alt="Soul Layer Logo"
          width={32}
          height={32}
          priority
          className="
            rounded-full
            border border-violet-500/40
            shadow-[0_0_6px_2px_rgba(184,51,245,0.5)]
          "
        />
        <span className="tracking-[0.28em] text-xs md:text-sm text-white/90">
          SOUL LAYER DIAGNOSIS
        </span>
      </div>
      <div className="w-6 h-6" />
    </header>
  )
}
