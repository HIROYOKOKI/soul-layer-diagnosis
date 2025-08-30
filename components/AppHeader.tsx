// components/AppHeader.tsx
"use client"

import { useEffect, useState } from "react";
import HeaderIcon from "./ui/HeaderIcon";
import { ArrowLeft } from "lucide-react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";   // 👈 差し替え

type Me = { plan: "free" | "premium"; avatarUrl?: string } | null;

type Props = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export default function AppHeader({ title, showBack = false, onBack }: Props) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = await r.json();
        if (alive) setMe(j);
      } catch {
        if (alive) setMe({ plan: "free" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* 左：戻る or プロフィールアイコン（無ければ青光ロゴ）＋タイトル */}
      <div className="flex items-center gap-2 min-w-0">
        {showBack ? (
          <button
            type="button"
            aria-label="戻る"
            onClick={onBack ?? (() => history.back())}
            className="h-8 w-8 rounded-full grid place-items-center bg-white/6 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4 text-white/85" aria-hidden="true" />
          </button>
        ) : (
          <HeaderIcon src={me?.avatarUrl ?? "/icon-512.png"} />
        )}
        <span className="truncate text-xs text-white/70">
          {title ?? "SOUL LAYER DIAGNOSIS"}
        </span>
      </div>

      {/* 右：設定ボタン（常時表示, Cog6ToothIcon に統一） */}
      <div className="h-10 w-10">
        {loading ? (
          <div className="h-10 w-10 rounded-full bg-white/6 animate-pulse" />
        ) : (
          <button
            aria-label="Settings"
            className="h-10 w-10 rounded-full grid place-items-center
                       bg-white/6 hover:bg-white/10 transition"
          >
            <Cog6ToothIcon className="h-6 w-6 text-white/80" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
