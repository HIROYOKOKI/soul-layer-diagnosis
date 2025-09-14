// app/welcome/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient(); // ← cookieベースのセッションを扱える

  useEffect(() => {
    let alive = true;

    // cookie書き込みのレースに備えて少しだけ再試行
    const check = async () => {
      // getUser() だと cookie セッションを直接確認できる
      const { data: { user } } = await supabase.auth.getUser();

      if (!alive) return;
      if (!user) {
        // もう一度だけ少し待って再チェック（emailリンク直後のレース対策）
        setTimeout(async () => {
          const { data: { user: u2 } } = await supabase.auth.getUser();
          if (!alive) return;
          if (!u2) router.replace("/login");
        }, 600);
      }
    };

    check();
    return () => { alive = false; };
  }, [router, supabase]);

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">登録が完了しました。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="/profile"
          className="text-center rounded-md bg-white text-black py-2 font-medium"
        >
          プロフィール入力へ
        </a>
        <a
          href="/mypage"
          className="text-center rounded-md border border-white/20 py-2"
        >
          マイページへ
        </a>
      </div>
    </main>
  );
}
