// app/welcome/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function WelcomePage() {
  const sb = getBrowserSupabase();
  const router = useRouter();
  const sp = useSearchParams();

  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        // 直接来た/セッション切れ → ログインへ
        router.replace("/login");
        return;
      }

      setEmail(data.session.user.email ?? null);

      // ユーザーコード取得（未付与なら付与するAPI）
      try {
        const res = await fetch("/api/user/code", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok) setUserCode(json.userCode);
      } catch (e: any) {
        setErr("ユーザー情報の取得に失敗しました。");
      }

      setReady(true);
    })();
  }, [sb, router]);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-2">ようこそ！</h1>
      <p className="text-white/70 mb-6">
        登録が完了しました。{email ? <>（{email}）</> : null}
      </p>

      {userCode && (
        <div className="mb-8 rounded-lg border border-white/15 bg-white/5 p-4">
          <p className="text-sm opacity-80 mb-1">あなたのユーザーID</p>
          <p className="font-mono text-xl flex items-center gap-2">
            <span className="opacity-80">𓂀</span>
            {userCode}
          </p>
        </div>
      )}
      {err && <p className="text-rose-400 text-sm mb-6">{err}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="/profile"
          className="text-center rounded-md bg-white text-black py-2 font-medium"
        >
          プロフィール入力へ
        </a>
        <a
          href="/mypage"
          className="text-center rounded-md border border-white/20 py-2"
        >
          マイページへ
        </a>
      </div>

      <p className="text-sm opacity-70 mt-6">
        ※ このページは登録直後だけに表示されます。以降はログインするとマイページに移動します。
      </p>
    </main>
  );
}
