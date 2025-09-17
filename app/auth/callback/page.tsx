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

      // Supabaseが付けた ?error=... があれば可視化
      const errParam = sp.get("error");
      if (errParam) {
        setMsg(`エラー: ${decodeURIComponent(errParam)}`);
        return;
      }

      // 新API（PKCE対応）。ブラウザの code_verifier を使ってセッション交換
      let error = null as any;
      try {
        const res = await supabase.auth.exchangeCodeForSession();
        error = res?.error ?? null;
      } catch (e) {
        error = e;
      }

      // 旧APIフォールバック（環境差異対策）
      if (error) {
        try {
          const res2 = await supabase.auth.getSessionFromUrl({ storeSession: true });
          error = res2?.error ?? null;
        } catch (e2) {
          error = e2;
        }
      }

      if (error) {
        setMsg(`ログインに失敗しました: ${String(error?.message || error)}`);
        return;
      }

      // 成功 → 次へ
      router.replace(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-[60vh] grid place-items-center text-white">
      <p className="text-sm opacity-80">{msg}</p>
    </main>
  );
}
