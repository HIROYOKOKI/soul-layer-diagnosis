// app/theme/apply/page.tsx
"use client";

// ❌ revalidate を export しない（ここは完全CSRでOK）
// ❌ dynamic も消して大丈夫です

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ApplyInner() {
  const router = useRouter();
  const qs = useSearchParams();

  useEffect(() => {
    const next =
      qs.get("to") ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("evae_theme_selected")
        : null) ||
      "dev";

    try {
      localStorage.setItem("ev-theme", next);
      sessionStorage.setItem("evae_theme_selected", next);
      document.documentElement.setAttribute("data-theme", next);
    } catch {
      // no-op
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
  return (
    <Suspense fallback={<div className="p-8 text-white/70">読み込み中…</div>}>
      <ApplyInner />
    </Suspense>
  );
}
