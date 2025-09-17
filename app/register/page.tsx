// app/register/page.tsx
"use client";
import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function RegisterPage() {
  const sb = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const site = useMemo(
    () => (typeof window !== "undefined" ? location.origin : "https://soul-layer-diagnosis.vercel.app"),
    []
  );
  // 新規登録は /welcome に飛ばす（intro=1 は任意）
  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent("/welcome?intro=1")}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true); setMsg(null); setErr(null);

    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },   // 👈 ここが重要
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。メール内のボタンから登録を完了してください。");
    } catch (e:any) {
      setErr(e?.message ?? "送信に失敗しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-semibold">新規登録</h1>
      <p className="text-sm text-white/70 mt-1">登録完了後は /welcome に移動します。</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-2">
        <input className="w-full rounded border border-white/20 bg-transparent p-2"
               type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
               placeholder="you@example.com" required />
        <button className="rounded bg-white text-black px-3 py-2" disabled={sending || !email}>
          {sending ? "送信中…" : "登録用メールを送信"}
        </button>
      </form>

      {msg && <p className="mt-2 text-emerald-300 text-sm">{msg}</p>}
      {err && <p className="mt-2 text-red-300 text-sm">{err}</p>}
    </main>
  );
}
