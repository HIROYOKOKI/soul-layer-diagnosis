// app/theme/confirm/ConfirmClient.tsx
"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function ConfirmClient() {
  const router = useRouter();
  const qs = useSearchParams();

  // /theme/confirm?to=love&redirect=/mypage を想定
  const fromQuery = (qs.get("to") || "").trim() as ThemeKey | "";
  const prev =
    typeof window !== "undefined"
      ? ((sessionStorage.getItem("evae_theme_selected") as ThemeKey | null) ?? null)
      : null;

  const selected: ThemeKey = useMemo(
    () => (THEMES.includes(fromQuery) ? fromQuery : (prev ?? "self")),
    [fromQuery, prev]
  );

  const redirect = (qs.get("redirect") || "/mypage").toString();

  const handleConfirmSave = useCallback(() => {
    try {
      sessionStorage.setItem("evae_theme_selected", selected);
      sessionStorage.setItem("evae_theme_applied_at", String(Date.now()));
    } catch {
      // no-op
    }
    router.push(redirect);
    router.refresh();
  }, [selected, redirect, router]);

  return (
    <main className="mx-auto max-w-md px-5 py-10 text-white">
      <h1 className="mb-4 text-xl font-semibold">テーマを変更しますか？</h1>
      <p className="mb-6 text-white/70">
        テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
      </p>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">選択中のテーマ</div>
        <div className="mt-1 text-lg font-medium">{LABEL[selected]}</div>
        <p className="mt-1 text-sm text-white/60">{DESC[selected]}</p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/theme")}
          className="rounded-md border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15"
        >
          いいえ（戻る）
        </button>

        <button
          type="button"
          onClick={handleConfirmSave}
          className="rounded-md border border-white/10 bg-white px-4 py-2 font-semibold text-black active:opacity-90"
        >
          確認した（保存してマイページへ）
        </button>
      </div>

      <div className="mt-6 text-xs text-white/50">
        適用テーマ：<span className="font-mono">{selected}</span> ／ 遷移先：{" "}
        <span className="font-mono">{redirect}</span>
      </div>
    </main>
  );
}
