// app/welcome/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) セッション確認（/auth/callback 経由なら確立済み）
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;

        if (!session) {
          router.replace("/login?e=nologin");
          return;
        }

        // 2) プロフィールを確実に作成（NO 付与など）
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          cache: "no-store",
        }).catch(() => {});

        // 3) 初回訪問フラグ（任意のAPI。存在しなくても無視）
        await fetch("/api/profile/welcome", {
          method: "POST",
          cache: "no-store",
        }).catch(() => {});

        // 4) テーマ設定の有無で分岐
        const tRes = await fetch("/api/theme", { cache: "no-store" }).catch(() => null);
        const tJson = tRes && tRes.ok ? await tRes.json().catch(() => null) : null;
        const theme: string | null = (tJson?.value ?? tJson?.scope ?? null) as string | null;

        // 初回は /theme、設定済みなら /mypage へ
        router.replace(theme ? "/mypage" : "/theme");
      } catch {
        if (alive) router.replace("/login?e=welcome_failed");
      }
    })();

    return () => { alive = false; };
  }, [router, supabase]);

  // 画面は出さずに短いローディングのみ
  return (
    <main className="flex items-center justify-center min-h-dvh text-white">
      <p className="animate-pulse">準備中...</p>
    </main>
  );
}
