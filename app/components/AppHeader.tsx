"use client"

import HeaderIcon from "./ui/HeaderIcon";
import { Settings } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-black">
      <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-[720px]">
        {/* 左：ブランド固定表示 */}
        <div className="flex items-center gap-2 min-w-0">
          <HeaderIcon src="/icon-512.png" />
          <span className="truncate text-xs text-white/70">
            SOUL LAYER DIAGNOSIS
          </span>
        </div>

        {/* 右：お好みの設定ボタン（シアン・24px） */}
        <button
          aria-label="Settings"
          className="h-10 w-10 rounded-full grid place-items-center
                     bg-white/6 hover:bg-white/10 transition"
        >
          <Settings className="h-6 w-6 text-sky-400" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
