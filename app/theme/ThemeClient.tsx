// app/theme/ThemeClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type ThemeKey = "work" | "love" | "future" | "self";
const THEMES: ThemeKey[] = ["work", "love", "future", "self"];

const LABEL: Record<ThemeKey, string> = {
  work: "仕事",
  love: "恋愛・結婚",
  future: "未来・進路",
  self: "自己理解・性格",
};

const DESC: Record<ThemeKey, string> = {
  work: "今の役割やキャリアの選び方を見直したい人へ",
  love: "価値観の相性や関係の深め方を知りたい人へ",
  future: "これからの進み方・分岐の判断材料が欲しい人へ",
  self: "自分の傾向を言語化し、日常の選択に活かしたい人へ",
};

// テーマ表示 → EV コードの保存用マッピング
const THEME_TO_EV: Record<ThemeKey, EV> = {
  work: "Λ",     // 選択
  love: "V",     // 可能性
  future: "E",   // 衝動/一歩
  self: "Ǝ",     // 観測
};

// env 分離（デフォルト dev）
const ENV: "dev" | "prod" =
  (process.env.NEXT_PUBLIC_APP_ENV as "dev" | "prod") || "dev";

export default function ThemeClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeKey | null>(null);
  const [saving, setSaving] = useState(false);

  // 直前の選択を復元（任意）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = sessionStorage.getItem("evae_theme_selected");
    if (prev && THEMES.includes(prev as ThemeKey)) {
      setSelected(prev as ThemeKey);
    }
  }, []);

  const handleSelect = (k: ThemeKey) => {
    setSelected(k);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("evae_theme_selected", k);
    }
    // 触感フィードバック（対応端末のみ）
    const nav = (typeof navigator !== "undefined" ? navigator : undefined) as
      | (Navigator & { vibrate?: (p: number | number[]) => boolean })
      | undefined;
    nav?.vibrate?.(10);
  };

  // ✅ ここで /api/theme へ保存して /mypage に遷移
  async function onSaveTheme() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const ev: EV = THEME_TO_EV[selected];
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: ev, env: ENV }),
      })
        .then((r) => r.json())
        .catch(() => ({ ok: false, error: "network_error" }));

      if (!res?.ok) {
  if (res?.error === "not_authenticated") {
    alert("ログインが必要です。ログイン画面へ移動します。");
    router.push("/login?next=/mypage");
    return;
  }
  alert("保存に失敗しました");
  return;
}

      router.push("/mypage");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="px-5 pt-4 pb-28">
        <h1 className="text-xl font-semibold tracking-wide">テーマ選択</h1>
        <p className="text-white/60 text-sm mt-1">
          今のあなたに一番近いテーマを1つ選んでください。
        </p>

        <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEMES.map((key) => {
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                aria-pressed={active}
                className={[
                  "w-full text-left rounded-2xl p-4",
                  "border transition-transform",
                  "active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "border-white/60 bg-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.12)_inset]"
                    : "border-white/10 bg-white/5 hover:bg-white/8",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-white/10 grid place-items-center">
                    <span className="text-sm">
                      {key === "work" && "Λ"}
                      {key === "love" && "V"}
                      {key === "future" && "E"}
                      {key === "self" && "Ǝ"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium">{LABEL[key]}</h2>
                      {active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15">
                          選択中
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1">{DESC[key]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* 下部：保存してマイページへ */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onSaveTheme}
          disabled={!selected || saving}
          className={[
            "w-full h-12 rounded-xl font-medium border border-white/10",
            !selected || saving
              ? "bg-white/10 text-white/50"
              : "bg-white text-black active:opacity-90",
          ].join(" ")}
        >
          {saving ? "保存中…" : "保存してマイページへ"}
        </button>
      </div>
    </div>
  );
}
