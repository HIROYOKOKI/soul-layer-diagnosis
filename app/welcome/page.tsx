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
        // /auth/callback で Cookie は確定済みの想定。
        // ここではセッションがあるかだけを確認する。
        const { data: { session } } = await supabase.auth.getSession();

        if (!alive) return;

        if (!session) {
          // 未ログインなら login へ（ハッシュ/クエリの有無は見ない）
          router.replace("/login?e=nologin");
        }
        // session があれば何もしない（画面表示を続行）
      } catch {
        if (alive) router.replace("/login?e=welcome_check_failed");
      }
    })();

    return () => { alive = false; };
  }, [router, supabase]);

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">登録が完了しました。</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="/welcome/lunea"
          className="text-center rounded-md bg-white text-black py-2 font-medium"
        >
          診断スタート
        </a>
      </div>
    </main>
  );
}
