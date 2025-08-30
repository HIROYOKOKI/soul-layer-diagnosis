// app/components/AppHeader.tsx
"use client"

import HeaderIcon from "@/components/ui/HeaderIcon";  // ← パスを修正！（@エイリアス）
                                                      // もしくは "../../components/ui/HeaderIcon"
export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-black">
      <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-[720px]">
        {/* 左：プロフィール未設定なら青光ロゴ */}
        <div className="flex items-center gap-2 min-w-0">
          <HeaderIcon src="/icon-512.png" />
          <span className="truncate text-xs text-white/70">
            SOUL LAYER DIAGNOSIS
          </span>
        </div>

        {/* 右：外の設定ボタンを使う方針なのでヘッダーは空 */}
        <div className="h-8 w-8" />
      </div>
    </header>
  );
}
