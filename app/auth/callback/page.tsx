// app/auth/callback/page.tsx
"use client";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const type = sp.get("type");         // 👈 Supabase が付与（signup / magiclink / recovery / invite など）
  const urlNext = sp.get("next");
  const next = useMemo(() => {
    if (urlNext) return urlNext;
    if (type === "signup" || type === "invite") return "/welcome?intro=1"; // 新規登録の既定
    return "/mypage";                                                       // 既存ログインの既定
  }, [type, urlNext]);

  useEffect(() => {
    (async () => {
      const supabase = createClientComponentClient();

      // 1) OAuth/PKCE（?code=...）
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (!error) return router.replace(next);
        console.error("exchange error:", error.message);
      }

      // 2) Magic Link の #access_token 形式（保険）
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token") && hash.includes("refresh_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const { error } = await supabase.auth.setSession({
          access_token: params.get("access_token")!,
          refresh_token: params.get("refresh_token")!,
        });
        if (!error) return router.replace(next);
        console.error("setSession error");
      }

      // 3) どちらも無ければログインへ
      router.replace(`/login?next=${encodeURIComponent(next)}&error=no_code`);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className="min-h-[60vh] grid place-items-center text-white">ログイン処理中…</main>;
}
