// app/register/page.tsx
"use client";

import { useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function RegisterPage() {
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

      const normalizedEmail = email.trim().toLowerCase();

      // ✅ 新規登録は signUp() を使う → 「Confirm signup」メールが送られる
      const { error } = await sb.auth.signUp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${base}/auth/callback?next=/welcome?intro=1`,
        },
      });

      if (error) throw error;
      setMsg("新規登録用の確認メールを送信しました。受信箱のリンクから続行してください。");
    } catch (e: any) {
      setErr(e?.message ?? "送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">新規登録</h1>

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
          {sending ? "送信中…" : "登録用リンクを送る"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-emerald-500">{msg}</p>}
      {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}

      <p className="mt-6 text-sm opacity-80">
        すでにアカウントをお持ちの方は{" "}
        <a href="/login" className="underline">ログイン</a>
      </p>
    </div>
  );
}
