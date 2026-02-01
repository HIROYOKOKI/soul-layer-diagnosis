// app/welcome/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Status = "loading" | "authed" | "guest";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setStatus(data.session ? "authed" : "guest");
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  async function onStart() {
    // ログイン済みのときだけ初回フラグを立てる
    if (status === "authed") {
      try {
        await fetch("/api/profile/welcomed", { method: "POST", cache: "no-store" });
      } catch {}
    }
    router.push("/welcome/lunea");
  }

  if (status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-dvh text-white">
        <p className="animate-pulse">準備中…</p>
      </main>
    );
  }

  if (status === "guest") {
    return (
      <main className="mx-auto max-w-lg px-6 py-12 text-white">
        <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
        <p className="text-white/70 mb-6">
          まずはルネアの紹介をご覧いただけます。記録の保存やマイページ機能はログイン後に利用できます。
        </p>

        <div className="space-y-3">
          <button
            onClick={onStart}
            className="w-full text-center rounded-md bg-white text-black py-2 font-medium"
          >
            まずは紹介を見る（/welcome/lunea）
          </button>

          <button
            onClick={() => router.push("/login?next=/welcome")}
            className="w-full text-center rounded-md border border-white/30 py-2 font-medium"
          >
            ログイン
          </button>

          <button
            onClick={() => router.push("/signup?next=/welcome")}
            className="w-full text-center rounded-md border border-white/30 py-2 font-medium"
          >
            新規登録
          </button>
        </div>
      </main>
    );
  }

  // status === "authed"
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
