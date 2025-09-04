// app/theme/apply/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ApplyInner() {
  const router = useRouter();
  const qs = useSearchParams();

  useEffect(() => {
    const q = qs.get("to");
    // ① ?to=... があれば優先、無ければ sessionStorage の選択、最後に "dev"
    const theme =
      q ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("evae_theme_selected")
        : null) ||
      "dev";

    try {
      // あなたのプロジェクトで参照しているキー名に合わせてください
      localStorage.setItem("ev-theme", theme);
      sessionStorage.setItem("evae_theme_selected", theme);
      // <html data-theme="..."> に反映している場合はここで反映してもOK
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      // 失敗しても致命的ではないのでそのまま遷移
    }

    const redirect = qs.get("redirect") || "/mypage";
    // 履歴を残さず目的地へ
    router.replace(redirect);
    router.refresh();
  }, [qs, router]);

  return (
    <div className="min-h-[60vh] grid place-items-center text-white/70">
      適用中…
    </div>
  );
}

export default function Page() {
  // useSearchParams を Suspense でラップ
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <ApplyInner />
    </Suspense>
  );
}
apply/page.tsx
