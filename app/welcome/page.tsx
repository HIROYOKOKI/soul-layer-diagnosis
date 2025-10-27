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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?e=nologin");
        return;
      }
      setOk(true);
    })();
  }, [router, supabase]);

  async function onStart() {
    // 初回表示フラグを押下時にだけ立てる
    await fetch("/api/profile/welcomed", { method: "POST", cache: "no-store" }).catch(() => {});
    router.push("/theme");
  }

  if (!ok) {
    return <main className="flex items-center justify-center min-h-dvh text-white"><p className="animate-pulse">準備中…</p></main>;
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">登録が完了しました。まずはテーマを選んで始めましょう。</p>
      <button
        onClick={onStart}
        className="w-full text-center rounded-md bg-white text-black py-2 font-medium"
      >
        はじめる
      </button>
    </main>
  );
}
