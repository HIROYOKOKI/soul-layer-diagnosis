"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const sb = getBrowserSupabase();
  const router = useRouter();
  const sp = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session) {
        const intro = sp.get("intro");
        router.replace(intro ? "/profile" : "/mypage");
      } else {
        setChecking(false);
      }
    })();
  }, [sb, router, sp]);

  if (checking) return null;
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">ログイン</h1>
      <LoginMagicOnly />
      <p className="mt-6 text-sm opacity-80">
        アカウントをお持ちでない方は{" "}
        <a href="/register" className="underline">新規登録</a>
      </p>
    </main>
  );
}

function LoginMagicOnly() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const BASE_URL = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "")) || "",
    []
  );

  async function onSendMagicLink() {
    setLoading(true); setMsg(null); setErr(null);
    try {
      if (!/\S+@\S+\.\S+/.test(email)) throw new Error("正しいメールアドレスを入力してください。");
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${BASE_URL}/login` },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。受信箱のリンクからログインしてください。");
    } catch (e: any) {
      setErr(e?.message ?? "メール送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSendMagicLink();}} className="space-y-4">
      <label className="block text-sm opacity-80">メールアドレス</label>
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
        disabled={loading || !email}
        className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
      >
        {loading ? "送信中…" : "メールリンクでログイン（パスワード不要）"}
      </button>

      {msg && <p className="text-emerald-500 text-sm">{msg}</p>}
      {err && <p className="text-rose-500 text-sm">{err}</p>}
      <p className="text-right text-sm mt-2">
        <a href="/intro" className="underline opacity-80">イントロへ戻る</a>
      </p>
    </form>
  );
}
