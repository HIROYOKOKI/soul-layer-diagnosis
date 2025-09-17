// app/auth/callback/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const sanitizeNext = (p?: string | null) => (p && p.startsWith("/") ? p : "/mypage");

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const type = sp.get("type"); // signup / magiclink / recovery / invite ...
  const urlNext = sp.get("next");

  // next の既定: 明示指定 > (signup|invite)=/welcome > /mypage
  const next = useMemo(
    () => sanitizeNext(urlNext ?? (type === "signup" || type === "invite" ? "/welcome?intro=1" : "/mypage")),
    [type, urlNext]
  );

  const [msg, setMsg] = useState("ログイン処理中…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 二重実行対策
    ran.current = true;

    (async () => {
      const supabase = createClientComponentClient();

      // Supabase が付けるエラーがあればすぐ戻す
      const errParam = sp.get("error") || sp.get("error_description");
      if (errParam) {
        const e = decodeURIComponent(errParam);
        setMsg(`ログインに失敗しました: ${e}`);
        router.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(e)}`);
        return;
      }

      // 成功後にサーバーCookieも同期（存在しなくてもOK）
      const finalize = async () => {
        try {
          await fetch("/api/auth/callback", { method: "POST" });
        } catch {}
        router.replace(next);
      };

      // 1) OAuth/PKCE: ?code=... があれば交換
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (!error) return finalize();
        setMsg(`ログインに失敗しました: ${error.message}`);
        router.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
        return;
      }

      // 2) Magic Link: ハッシュにトークンが来るケース（保険）
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token") && hash.includes("refresh_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const { error } = await supabase.auth.setSession({
          access_token: params.get("access_token")!,
          refresh_token: params.get("refresh_token")!,
        });
        if (!error) return finalize();
        setMsg(`ログインに失敗しました: ${error?.message ?? "setSession 失敗"}`);
        router.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error?.message ?? "setSession")}`);
        return;
      }

      // 3) どちらも無ければ期限切れ/別ウィンドウなど
      setMsg("ログインURLの有効期限が切れたか、別ウィンドウで開かれました。もう一度ログインしてください。");
      router.replace(`/login?next=${encodeURIComponent(next)}&error=no_code`);
    })();
  }, [sp, next, router]);

  return (
    <main className="min-h-[60vh] grid place-items-center text-white">
      <p className="text-sm opacity-80">{msg}</p>
    </main>
  );
}
