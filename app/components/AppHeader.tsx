// app/components/AppHeader.tsx
"use client"

import HeaderIcon from "@/components/ui/HeaderIcon"; // ← 相対ではなくエイリアス
import { Settings } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-black">
      <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-[720px]">
        <div className="flex items-center gap-2 min-w-0">
          <HeaderIcon src="/icon-512.png" />
          <span className="truncate text-xs text-white/70">SOUL LAYER DIAGNOSIS</span>
        </div>
        {/* ヘッダーは歯車なし。外（カード側）の設定ボタンを使う方針 */}
        <div className="h-8 w-8" />
      </div>
    </header>
  );
}
