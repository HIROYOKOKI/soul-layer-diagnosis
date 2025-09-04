// app/theme/apply/page.tsx
"use client";

export const dynamic = "force-dynamic"; // 事前レンダリングさせない
export const revalidate = 0;

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ApplyInner() {
  const router = useRouter();
  const qs = useSearchParams();

  useEffect(() => {
    // ① ?to=... 優先 → ② sessionStorage の選択 → ③ "dev"
    const next =
      qs.get("to") ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("evae_theme_selected")
        : null) ||
      "dev";

    try {
      localStorage.setItem("ev-theme", next);
      sessionStorage.setItem("evae_theme_selected", next);
      // data-theme を使っている場合のみ
      document.documentElement.setAttribute("data-theme", next);
    } catch {
      // 何もしない（致命的ではない）
    }

    const redirect = qs.get("redirect") || "/mypage";
    router.replace(redirect);
    router.refresh();
  }, [qs, router]);

  return (
    <div className="min-h-[60vh] grid place-items-center text-white/70">
      適用中…
    </div>
  );
}

export default function ApplyPage() {
  // useSearchParams() を Suspense でラップ
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <ApplyInner />
    </Suspense>
  );
}
