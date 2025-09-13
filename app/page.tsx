"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const sb = getBrowserSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/mypage");
      } else {
        router.replace("/intro");
      }
    });
  }, [router]);

  return null; // ローディング演出を入れてもOK
}
