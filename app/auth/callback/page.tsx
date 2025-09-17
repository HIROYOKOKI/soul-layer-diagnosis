"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/mypage";
  const [msg, setMsg] = useState("ログイン処理中…");

  useEffect(() => {
    (async () => {
      const supabase = createClientComponentClient();

      // Magic Link / OAuth 共通：PKCE付きセッション交換（これだけでOK）
      const { error } = await supabase.auth.exchangeCodeForSession();

      if (error) {
        setMsg(`ログインに失敗しました: ${error.message}`);
        // 必要なら ↓ を有効にしてログインへ戻す
        // router.replace(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
        return;
      }
      router.replace(next);
    })();
  }, [router, next]);

  return (
    <main className="min-h-[60vh] grid place-items-center text-white">
      <p className="text-sm opacity-80">{msg}</p>
    </main>
  );
}
