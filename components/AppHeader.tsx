// components/AppHeader.tsx
"use client"

import HeaderIcon from "./ui/HeaderIcon";
import { Settings, ArrowLeft } from "lucide-react";

type Props = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** プロフィール画像があれば渡す。未指定なら青光ロゴを表示 */
  avatarSrc?: string | null;
};

export default function AppHeader({
  title,
  showBack = false,
  onBack,
  avatarSrc,
}: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* 左：戻る or プロフィールアイコン（未設定時は青光ロゴ）＋タイトル */}
      <div className="flex items-center gap-2 min-w-0">
        {showBack ? (
          <button
            type="button"
            aria-label="戻る"
            onClick={onBack ?? (() => history.back())}
            className="h-8 w-8 rounded-full grid place-items-center bg-white/6 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4 text-white/85" aria-hidden />
          </button>
        ) : (
          <HeaderIcon src={avatarSrc ?? "/icon-512.png"} />
        )}
        <span className="truncate text-xs text-white/70">
          {title ?? "SOUL LAYER DIAGNOSIS"}
        </span>
      </div>

      {/* 右：設定ボタン（常時表示｜24px｜明るいシアン） */}
      <button
        aria-label="Settings"
        className="h-10 w-10 rounded-full grid place-items-center
                   bg-white/6 hover:bg-white/10 transition"
      >
        <Settings className="h-6 w-6 text-sky-400" aria-hidden />
      </button>
    </header>
  );
}
