// app/login/page.tsx
"use client";

import { useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const v = email.trim().toLowerCase();
    return /\S+@\S+\.\S+/.test(v) && !sending;
  }, [email, sending]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setMsg(null);
    setErr(null);

    try {
      const base =
        (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") as string) ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const mail = email.trim().toLowerCase();

      // 既存ユーザーはログイン後に /mypage へ
      const { error } = await sb.auth.signInWithOtp({
        email: mail,
        options: {
          emailRedirectTo: `${base}/auth/callback?next=/mypage`,
        },
      });
      if (error) throw error;

      setMsg("ログイン用の確認メールを送信しました。受信箱のリンクから続行してください。");
    } catch (e: any) {
      setErr(e?.message ?? "ログインに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">ログイン</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm opacity-80 mb-1">メールアドレス</label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
          autoComplete="email"
          inputMode="email"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
        >
          {sending ? "送信中…" : "ログイン用リンクを送る"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-emerald-500">{msg}</p>}
      {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}

      <p className="mt-6 text-sm opacity-80">
        アカウントをお持ちでない方は{" "}
        <a href="/register" className="underline">新規登録</a>
      </p>
    </div>
  );
}
