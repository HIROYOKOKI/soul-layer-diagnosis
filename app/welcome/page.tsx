"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        // 1) code / access_token がある場合はセッション交換
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.get("code") || url.hash.includes("access_token")) {
            await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
            // URLをクリーンに
            window.history.replaceState({}, "", "/welcome");
          }
        }

        // 2) ユーザーセッション確認
        const check = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!alive) return;
          if (!user) {
            await new Promise(r => setTimeout(r, 500));
            const { data: { user: u2 } } = await supabase.auth.getUser();
            if (!alive) return;
            if (!u2) router.replace("/login");
          }
        };
        await check();
      } catch {
        router.replace("/login");
      }
    };

    run();
    return () => { alive = false; };
  }, [router, supabase]);

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">登録が完了しました。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* 🔽 プロフィール入力をルネア動画ページに変更 */}
        <a href="/welcome/lunea" className="text-center rounded-md bg-white text-black py-2 font-medium">
          プロフィール入力へ
        </a>
        <a href="/mypage" className="text-center rounded-md border border-white/20 py-2">
          マイページへ
        </a>
      </div>
    </main>
  );
}
