"use client"

import { useEffect, useState } from "react";
import HeaderIcon from "./ui/HeaderIcon";
import { Settings, ArrowLeft } from "lucide-react";

type Me = { plan: "free" | "premium" } | null

type Props = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

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
    return () => { alive = false };
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* 左：戻る or ロゴ＋タイトル */}
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
          <HeaderIcon src="/icon-512.png" />
        )}
        <span className="truncate text-xs text-white/70">
          {title ?? "SOUL LAYER DIAGNOSIS"}
        </span>
      </div>

      {/* 右：設定ボタン（Premiumのみ） */}
      <div className="h-8 w-8">
        {loading ? (
          <div className="h-8 w-8 rounded-full bg-white/6 animate-pulse" />
        ) : me?.plan === "premium" ? (
          <button
            aria-label="Settings"
            className="h-8 w-8 rounded-full grid place-items-center
                       bg-white/6 hover:bg-white/10 transition"
          >
            <Settings className="h-4 w-4 text-white/80" aria-hidden="true" />
          </button>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>
    </header>
  );
}
