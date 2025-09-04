// app/theme/confirm/page.tsx
"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "テーマ変更の確認 | Soul Layer",
  description: "テーマ変更時の確認ページ",
};

function ConfirmInner() {
  const router = useRouter();
  const qs = useSearchParams();

  // /theme/confirm?to=work&redirect=/mypage の想定
  const nextTheme = (qs.get("to") || "dev").trim();
  const redirect = qs.get("redirect") || "/mypage";

  const handleApply = useCallback(() => {
    try {
      localStorage.setItem("ev-theme", nextTheme);
      sessionStorage.setItem("evae_theme_selected", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
    } catch {
      // no-op
    }
    router.push(redirect);
    router.refresh();
  }, [nextTheme, redirect, router]);

  return (
    <main className="mx-auto max-w-md px-5 py-10 text-white">
      <h1 className="text-xl font-semibold mb-4">テーマを変更しますか？</h1>
      <p className="text-white/70 mb-6">
        テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/theme")}
          className="rounded-md px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
        >
          いいえ（戻る）
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110"
        >
          はい、変更する
        </button>
      </div>

      <div className="mt-6 text-xs text-white/50">
        適用テーマ: <span className="font-mono">{nextTheme}</span> ／
        遷移先: <span className="font-mono">{redirect}</span>
      </div>
    </main>
  );
}

export default function ConfirmThemePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <ConfirmInner />
    </Suspense>
  );
}
