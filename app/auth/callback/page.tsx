"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/mypage";

  useEffect(() => {
    (async () => {
      const supabase = createClientComponentClient();
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (!error) return router.replace(next);
        console.error("exchange error:", error.message);
        return;
      }
      // Magic Link の #access_token 形式にも対応（保険）
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token") && hash.includes("refresh_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        await supabase.auth.setSession({
          access_token: params.get("access_token")!,
          refresh_token: params.get("refresh_token")!,
        });
        return router.replace(next);
      }
      router.replace(`/login?error=no_code&next=${encodeURIComponent(next)}`);
    })();
  }, [router, sp, next]);

  return <main className="min-h-[60vh] grid place-items-center text-white">ログイン処理中…</main>;
}
