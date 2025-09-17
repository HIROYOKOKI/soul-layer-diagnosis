"use client";

import { useState, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function IntroClient() {
  const sb = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // サイトURL（本番環境変数 or location.origin）
  const site = useMemo(() => {
    if (typeof window !== "undefined") return location.origin;
    return process.env.NEXT_PUBLIC_SITE_URL || "https://soul-layer-diagnosis.vercel.app";
  }, []);

  // 新規登録は /welcome?intro=1 に飛ばしたい
  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent("/welcome?intro=1")}`;

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true, // 新規作成を許可
        },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。届いたリンクを開いて登録を完了してください。");
    } catch (e: any) {
      setErr(e?.message || "メール送信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={signUp} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full rounded border border-gray-300 bg-transparent p-2 text-black"
      />
      <button
        disabled={sending || !email}
        className="w-full rounded bg-blue-600 px-3 py-2 text-white font-medium hover:opacity-90"
      >
        {sending ? "送信中…" : "新規登録メールを送信"}
      </button>
      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </form>
  );
}
