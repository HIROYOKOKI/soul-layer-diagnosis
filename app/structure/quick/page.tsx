"use client";

import Link from "next/link";
// もし useRouter で自動遷移したい場合は ↓ を使う
// import { useRouter } from "next/navigation";

export default function QuickResultPage() {
  // const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      {/* 既存の結果カードたち */}

      {/* ▼ 追加：テーマ選択へ */}
      <Link
        href="/theme"
        className="block w-full rounded-xl bg-white/10 px-6 py-3 text-center text-sm font-medium hover:bg-white/20 transition"
      >
        テーマを選ぶ
      </Link>

      {/* 既存：マイページへ */}
      <Link
        href="/mypage"
        className="block w-full rounded-xl border border-white/15 px-6 py-3 text-center text-sm font-medium hover:bg-white/10 transition"
      >
        マイページへ
      </Link>
    </div>
  );
}
