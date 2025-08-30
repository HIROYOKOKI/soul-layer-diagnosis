// app/theme/confirm/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "テーマ変更の確認 | Soul Layer",
  description: "テーマ変更時の確認ページ",
};

export default function ConfirmThemePage() {
  return (
    <main className="mx-auto max-w-md px-5 py-10 text-white">
      <h1 className="text-xl font-semibold mb-4">テーマを変更しますか？</h1>
      <p className="text-white/70 mb-6">
        テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
      </p>

      <div className="flex gap-3">
        <Link
          href="/theme"
          className="rounded-md px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
        >
          いいえ（戻る）
        </Link>
        <Link
          href="/theme/apply" // ← 変更確定の飛び先（必要に応じて実在のパスに）
          className="rounded-md px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110"
        >
          はい、変更する
        </Link>
      </div>
    </main>
  );
}
