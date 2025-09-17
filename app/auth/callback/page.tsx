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
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (!error) router.replace(next);
      else console.error("exchange error:", error.message);
    })();
  }, [router, next]);

  return <main className="min-h-[60vh] grid place-items-center text-white">ログイン処理中…</main>;
}
