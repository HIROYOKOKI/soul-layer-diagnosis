"use client";

import { useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function SignupEmailOnly() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sentOnce, setSentOnce] = useState(false);

  const canSubmit = useMemo(
    () => /\S+@\S+\.\S+/.test(email) && !sending,
    [email, sending]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setMsg(null);
    setErr(null);
    try {
      const origin = window.location.origin;
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/login?intro=1` },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。受信箱をご確認ください。");
      setSentOnce(true);
    } catch (e: any) {
      setErr(e?.message ?? "送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  async function onResend() {
    if (!/\S+@\S+\.\S+/.test(email)) return;
    const origin = window.location.origin;
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/login?intro=1` },
    });
    setMsg("確認メールを再送しました。受信箱をご確認ください。");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">新規登録</h1>
      <form onSubmit={onSubmit} className="space-y-4">
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

      {/* 再送リンクは送信後だけ表示 */}
      {sentOnce && (
        <button onClick={onResend} className="mt-4 underline text-sm">
          確認メールを再送する
        </button>
      )}

      {msg && <p className="mt-2 text-sm text-emerald-500">{msg}</p>}
      {err && <p className="mt-2 text-sm text-rose-500">{err}</p>}

      <p className="mt-6 text-sm opacity-80">
        すでにアカウントをお持ちの方は{" "}
        <a href="/login" className="underline">ログイン</a>
      </p>
    </div>
  );
}
