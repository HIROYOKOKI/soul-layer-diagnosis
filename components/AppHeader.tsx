// components/AppHeader.tsx
"use client"

import HeaderIcon from "./ui/HeaderIcon";

type Props = {
  title?: string;
  showBack?: boolean;       // 使っていればそのまま可
  onBack?: () => void;
};

export default function AppHeader({ title, showBack=false, onBack }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* 左：プロフィール（未設定なら青光ロゴ） */}
      <div className="flex items-center gap-2 min-w-0">
        <HeaderIcon src="/icon-512.png" />
        {/* ロゴ画像（/public に置いてある想定。無ければテキストに自動フォールバック） */}
        <div className="min-w-0">
          <img
            src="/soul-layer-diagnosis.png"
            alt="SOUL LAYER DIAGNOSIS"
            className="h-4 hidden sm:block"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <span className="sm:hidden block text-xs text-white/70">
            {title ?? "SOUL LAYER DIAGNOSIS"}
          </span>
        </div>
      </div>

      {/* 右：何も置かない（歯車なし） */}
      <div className="h-8 w-8" />
    </header>
  );
}
