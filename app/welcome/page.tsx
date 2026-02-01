// app/welcome/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
   
        return;
      }
      setOk(true);
    })();
  }, [router, supabase]);

  async function onStart() {
    // 初回表示フラグはここで立てる（失敗しても遷移は継続）
    try {
      await fetch("/api/profile/welcomed", { method: "POST", cache: "no-store" });
    } catch {}
    // まずはルネア紹介へ（動画終了後に /theme へ進む）
    router.push("/welcome/lunea");
  }

  if (!ok) {
    return (
      <main className="flex items-center justify-center min-h-dvh text-white">
        <p className="animate-pulse">準備中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">
        登録が完了しました。まずはルネアの紹介動画をご覧ください。
      </p>
      <button
        onClick={onStart}
        className="w-full text-center rounded-md bg-white text-black py-2 font-medium"
      >
        はじめる（/welcome/lunea へ）
      </button>
    </main>
  );
}
