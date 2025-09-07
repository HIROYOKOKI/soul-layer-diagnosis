// app/theme/confirm/ConfirmClient.tsx
"use client";

import { Suspense, useCallback } from "react";
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

function Inner() {
  const router = useRouter();
  const qs = useSearchParams();

  // /theme/confirm?to=love&redirect=/mypage を想定
  const fromQuery = (qs.get("to") || "").trim() as ThemeKey | "";
  // クエリが無い場合は直前の選択をフォールバック
  const prev = (typeof window !== "undefined"
    ? (sessionStorage.getItem("evae_theme_selected") as ThemeKey | null)
    : null) || null;

  const selected: ThemeKey = THEMES.includes(fromQuery)
    ? fromQuery
    : (prev ?? "self");

  const redirect = qs.get("redirect") || "/mypage";

  const handleConfirmSave = useCallback(() => {
    try {
      // ✅ ここで保存（「確認した」タイミング）
      sessionStorage.setItem("evae_theme_selected", selected);
      sessionStorage.setItem("evae_theme_applied_at", String(Date.now()));
      // ※ UI配色テーマなど別キー（ev-theme）を使っているなら、ここでは触らない
      // document.documentElement.setAttribute("data-theme", selected) // ←不要なら外す
    } catch {
      // no-op
    }
    // 保存後、マイページへ
    router.push(redirect);
    router.refresh();
  }, [selected, redirect, router]);

  return (
    <main className="mx-auto max-w-md px-5 py-10 text-white">
      <h1 className="text-xl font-semibold mb-4">テーマを変更しますか？</h1>
      <p className="text-white/70 mb-6">
        テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
      </p>

      {/* 確認用プレビュー（任意） */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6">
        <div className="text-sm text-white/60">選択中のテーマ</div>
        <div className="mt-1 text-lg font-medium">{LABEL[selected]}</div>
        <p className="text-sm text-white/60 mt-1">{DESC[selected]}</p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/theme")}
          className="rounded-md px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
        >
          いいえ（戻る）
        </button>

        {/* ✅ ラベルを「確認した（保存してマイページへ）」に変更 */}
        <button
          type="button"
          onClick={handleConfirmSave}
          className="rounded-md px-4 py-2 bg-white text-black border border-white/10 active:opacity-90"
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

export default function ConfirmClient() {
  // useSearchParams の要件を満たすため Suspense でラップ
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <Inner />
    </Suspense>
  );
}
