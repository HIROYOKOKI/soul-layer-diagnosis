// app/login/Client.tsx
"use client";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginClient() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTo = `${location.origin}/api/auth/callback?next=/mypage`;

  const signInGoogle = async () => {
    setLoading(true);
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setMsg(error.message);
    setLoading(false);
  };

  const signUp = async () => {
    setLoading(true);
    const { error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: redirectTo } });
    setMsg(error ? error.message : "確認メールを送信しました。");
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) setMsg(error.message);
    else location.href = "/mypage";
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <button onClick={signInGoogle} className="w-full rounded bg-white text-black py-2" disabled={loading}>
        Googleで続ける
      </button>
      <div className="h-px bg-white/10" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メール" className="w-full rounded border px-3 py-2 bg-white/5" />
      <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="パスワード" className="w-full rounded border px-3 py-2 bg-white/5" />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={signUp} className="rounded border px-3 py-2" disabled={loading}>新規登録</button>
        <button onClick={signIn} className="rounded bg-white text-black px-3 py-2" disabled={loading}>ログイン</button>
      </div>
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
