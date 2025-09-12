// app/login/Client.tsx（クライアント）
"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginClient() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const redirectTo = `${location.origin}/api/auth/callback?next=/mypage`;

  const signInGoogle = async () => {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setMsg(error.message);
    setLoading(false);
  };

  const signUpWithPassword = async () => {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { emailRedirectTo: redirectTo },
    });
    setMsg(error ? error.message : "確認メールを送信しました。メール内リンクを開いてください。");
    setLoading(false);
  };

  const signInWithPassword = async () => {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setMsg(error.message);
    else window.location.href = "/mypage";
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={signInGoogle}
        className="w-full rounded-md bg-white text-black py-2 font-semibold"
        disabled={loading}
      >
        Google で続ける
      </button>

      <div className="h-px bg-white/10" />

      <input
        className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2"
        type="password"
        placeholder="パスワード"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={signUpWithPassword} className="rounded-md border border-white/20 px-3 py-2" disabled={loading}>
          新規登録
        </button>
        <button onClick={signInWithPassword} className="rounded-md bg-white text-black px-3 py-2" disabled={loading}>
          ログイン
        </button>
      </div>

      <button onClick={signOut} className="text-sm text-white/60 underline">
        ログアウト
      </button>

      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
