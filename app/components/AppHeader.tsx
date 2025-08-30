// components/AppHeader.tsx
"use client"

import HeaderIcon from "@/components/ui/HeaderIcon";
import { Settings } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-black">
      <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-[720px]">
        
        {/* 左：ロゴ＋タイトル */}
        <div className="flex items-center gap-2 min-w-0">
          <HeaderIcon src="/icon-512.png" />
          <span className="truncate text-xs text-white/70">
            SOUL LAYER DIAGNOSIS
          </span>
        </div>

        {/* 右：FREEピル＋お気に入りの歯車 */}
       // components/AppHeader.tsx（抜粋）
<div className="flex items-center gap-2">
  <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/70">FREE</span>
  <button
    aria-label="Settings"
    className="header-settings h-8 w-8 rounded-full grid place-items-center
               bg-white/6 hover:bg-white/10 transition"
  >
    <Settings className="h-6 w-6 text-sky-400" aria-hidden="true" />
  </button>
</div>
      </div>
    </header>
  );
}
