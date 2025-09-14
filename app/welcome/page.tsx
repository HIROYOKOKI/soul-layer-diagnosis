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

    const run = async () => {
      try {
        // 1) URLに code / access_token が付いている場合は、ここでセッション交換
        //    （/auth/callback を経由せず /welcome 直行した古いリンクにも対応）
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.get("code") || url.hash.includes("access_token")) {
            await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
            // URLをクリーンにする
            window.history.replaceState({}, "", "/welcome");
          }
        }

        // 2) クッキーセッションを取得（少し待ってリトライも）
        const check = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!alive) return;
          if (!user) {
            // 反映レース対策でワンショット再試行
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
        <a href="/profile" className="text-center rounded-md bg-white text-black py-2 font-medium">
          プロフィール入力へ
        </a>
        <a href="/mypage" className="text-center rounded-md border border-white/20 py-2">
          マイページへ
        </a>
      </div>
    </main>
  );
}
