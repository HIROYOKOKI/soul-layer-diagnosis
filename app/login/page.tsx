"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/**
 * /login
 * - 既ログインなら /mypage にリダイレクト
 * - メール+パスワード or Magic Link でログイン
 * - /register からの初回導線は ?intro=1 を付与しておくと UX 良い（/profile に送るなど）
 */
export default function LoginPage() {
  const sb = getBrowserSupabase();
  const router = useRouter();
  const sp = useSearchParams();

  // 初期：セッションがあれば即遷移
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session) {
        // 初回導線が来ていたら /profile、それ以外は /mypage
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
      <LoginForm />
      <p className="mt-6 text-sm opacity-80">
        アカウントをお持ちでない方は{" "}
        <a href="/register" className="underline">新規登録</a>
      </p>
    </main>
  );
}

/* =========================
   フォーム本体（自己完結）
   ========================= */
function LoginForm() {
  const sb = getBrowserSupabase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 本番URLは env 優先（origin 依存を避けて安定化）
  const BASE_URL = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "")) || "",
    []
  );

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: pwd,
      });
      if (error) throw error;
      if (data.session) router.replace("/mypage");
    } catch (e: any) {
      setErr(humanizeAuthError(e?.message ?? "ログインに失敗しました"));
    } finally {
      setLoading(false);
    }
  }

  async function onSendMagicLink() {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error("正しいメールアドレスを入力してください。");
      }
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${BASE_URL}/login` },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。受信箱のリンクからログインしてください。");
    } catch (e: any) {
      setErr(humanizeAuthError(e?.message ?? "メール送信に失敗しました"));
    } finally {
      setLoading(false);
    }
  }

  async function onSendReset() {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error("パスワード再設定にはメールアドレスが必要です。");
      }
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${BASE_URL}/reset`,
      });
      if (error) throw error;
      setMsg("再設定メールを送信しました。受信箱をご確認ください。");
    } catch (e: any) {
      setErr(humanizeAuthError(e?.message ?? "メール送信に失敗しました"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onPasswordLogin} className="space-y-4">
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

      <label className="block text-sm opacity-80">パスワード</label>
      <input
        type="password"
        placeholder="8文字以上"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        className="w-full rounded-md border px-3 py-2 bg-transparent"
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
      >
        {loading ? "処理中…" : "メール＋パスワードでログイン"}
      </button>

      <div className="text-center text-sm opacity-70">— または —</div>

      <button
        type="button"
        onClick={onSendMagicLink}
        disabled={loading || !email}
        className="w-full rounded-md border py-2 disabled:opacity-50"
        title={!email ? "先にメールを入力してください" : ""}
      >
        メールリンクでログイン（パスワード不要）
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onSendReset} className="underline opacity-80">
          パスワードをお忘れの方
        </button>
        <a href="/intro" className="underline opacity-80">イントロへ戻る</a>
      </div>

      {msg && <p className="text-emerald-500 text-sm">{msg}</p>}
      {err && <p className="text-rose-500 text-sm">{err}</p>}
    </form>
  );
}

/* ============ helpers ============ */
function humanizeAuthError(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "メールまたはパスワードが違います。";
  if (/Email not confirmed/i.test(msg)) return "メール確認が未完了です。受信箱をご確認ください。";
  if (/too many requests/i.test(msg)) return "試行回数が多すぎます。少し待ってから再度お試しください。";
  return msg;
}
