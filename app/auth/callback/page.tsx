// app/auth/callback/page.tsx
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

      // 1) OAuth/PKCE: ?code=... があれば exchange
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (!error) return router.replace(next);
        console.error("exchange error:", error.message);
        setMsg(`ログインに失敗しました: ${error.message}`);
        return;
      }

      // 2) Magic Link: ハッシュ(#)に access_token / refresh_token が来るケースへ対応
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token") && hash.includes("refresh_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token")!;
        const refresh_token = params.get("refresh_token")!;
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) return router.replace(next);
        console.error("setSession error:", error?.message);
        setMsg(`ログインに失敗しました: ${error?.message ?? "setSession 失敗"}`);
        return;
      }

      // 3) どちらも無い → たぶん古いリンク or 別ウィンドウ
      setMsg("ログインリンクの有効期限切れ、または別ウィンドウで開かれました。もう一度ログインしてください。");
      router.replace(`/login?next=${encodeURIComponent(next)}&error=no_code`);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-[60vh] grid place-items-center text-white">
      <p className="text-sm opacity-80">{msg}</p>
    </main>
  );
}
