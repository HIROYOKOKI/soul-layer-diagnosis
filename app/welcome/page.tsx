// app/welcome/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

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
