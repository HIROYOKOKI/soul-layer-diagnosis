// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const sb = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/mypage";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(sp.get("err"));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);
    router.replace(next);
  }

  async function onForgot() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr("メールアドレスを入力してください");
      return;
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const redirectTo = `${site}/auth/callback?next=/login?reset=1`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setErr(error ? error.message : "パスワード再設定メールを送信しました。");
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">ご利用中の方（ログイン）</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full rounded bg-white/10 px-4 py-2 hover:bg-white/15">
          ログイン
        </button>
      </form>

      <button
        onClick={onForgot}
        className="w-full text-sm underline opacity-80 hover:opacity-100"
      >
        パスワードをお忘れですか？
      </button>

      <div className="text-sm opacity-70">
        はじめての方は{" "}
        <a className="underline" href="/register">新規登録へ</a>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
