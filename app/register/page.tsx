// app/register/page.tsx
"use client";

import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function RegisterPage() {
  const sb = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // 以後は /login で即ログイン可能
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const can = useMemo(
    () => /\S+@\S+\.\S+/.test(email) && password.length >= 6 && !sending,
    [email, password, sending]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!can) return;
    setSending(true);
    setMsg(null);
    setErr(null);

    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const redirectTo = `${site}/auth/callback?next=/welcome`;

      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) setErr(error.message);
      else setMsg("確認メールを送信しました。メールのリンクを開いて登録を完了してください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">はじめての方（新規登録）</h1>
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
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={!can} className="w-full rounded bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-40">
          登録メールを送信
        </button>
      </form>

      <div className="text-sm opacity-70">
        すでにアカウントをお持ちの方は{" "}
        <a className="underline" href="/login">ログインへ</a>
      </div>

      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
