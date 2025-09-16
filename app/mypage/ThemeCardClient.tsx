// app/mypage/ThemeCardClient.tsx
"use client";

import { useEffect, useState } from "react";

type ThemeKey = "work" | "love" | "future" | "self";
const LABEL: Record<ThemeKey, string> = {
  work: "仕事",
  love: "恋愛・結婚",
  future: "未来・進路",
  self: "自己理解・性格",
};

export default function ThemeCardClient() {
  const [theme, setTheme] = useState<ThemeKey | null>(null);
  const [appliedAt, setAppliedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("evae_theme_selected") as ThemeKey | null;
      const at = Number(sessionStorage.getItem("evae_theme_applied_at") || "") || null;
      if (t && ["work", "love", "future", "self"].includes(t)) setTheme(t as ThemeKey);
      if (at) setAppliedAt(at);
    } catch {}
  }, []);

  return (
    <section className="rounded-xl border border-white/15 bg-white/5 p-4">
      <div className="text-sm text-white/60">現在のテーマ</div>
      <div className="mt-1 text-lg font-semibold">{theme ? LABEL[theme] : "未設定"}</div>
      {appliedAt && (
        <div className="mt-1 text-xs text-white/50">
          反映: {new Date(appliedAt).toLocaleString("ja-JP")}
        </div>
      )}
    </section>
  );
}
