// app/theme/confirm/page.tsx
"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmInner() {
  const router = useRouter();
  const qs = useSearchParams();

  // /theme/confirm?to=work&redirect=/mypage の想定
  const nextTheme = (qs.get("to") || "dev").trim();
  const redirect = qs.get("redirect") || "/mypage";

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleApply = useCallback(() => {
    try {
      // UI適用用キー（あなたのプロジェクトで参照するキー名に合わせてください）
      localStorage.setItem("ev-theme", nextTheme);
      // ついでに選択保持（不要なら削除OK）
      sessionStorage.setItem("evae_theme_selected", nextTheme);
    } catch {
      // 失敗しても致命的ではないので静かに続行
    }
    router.push(redirect);
    router.refresh();
  }, [nextTheme, redirect, router]);

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold mb-3">テーマを変更しますか？</h1>
        <p className="text-sm text-white/70 mb-8">
          テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg px-4 py-2 bg-neutral-700/60 hover:bg-neutral-600"
          >
            いいえ（戻る）
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg px-4 py-2 bg-sky-600 hover:bg-sky-500"
          >
            はい、変更する
          </button>
        </div>

        <div className="mt-6 text-xs text-white/50 space-x-2">
          <span>適用テーマ：<span className="font-mono">{nextTheme}</span></span>
          <span>／</span>
          <span>遷移先：<span className="font-mono">{redirect}</span></span>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  // ✅ useSearchParams を Suspense でラップ（Next.js 警告の解消）
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <ConfirmInner />
    </Suspense>
  );
}
