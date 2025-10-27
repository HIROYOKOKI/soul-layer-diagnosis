// app/login/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const sb = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  // メールリンクからの遷移は /welcome を既定に
  const next = sp.get("next") || "/welcome";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(sp.get("err"));

  // ===== 追加：メールリンクで飛んできた場合に自動でセッションを確立して /welcome へ =====
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        const code = sp.get("code");                       // Magic Link / PKCE
        const type = (sp.get("type") || "").toLowerCase(); // signup, magiclink, recovery...
        const token_hash = sp.get("token_hash");           // Confirm signup 等
        const token = sp.get("token");                     // 稀に token で来る

        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace(next);
          return;
        }

        if (token_hash || token) {
          const verifyType =
            ["signup", "magiclink", "recovery", "invite", "email_change"].includes(type)
              ? (type as any)
              : ("signup" as const);

          const { error } = await sb.auth.verifyOtp({
            type: verifyType,
            token_hash: token_hash ?? undefined,
            token: token ?? undefined,
          } as any);
          if (error) throw error;
          router.replace(next);
          return;
        }
      } catch (e: any) {
        // 失敗しても通常のログインフォームは使える
        console.error("[login callback bridge]", e);
        setErr(e?.message ?? "ログインリンクの処理に失敗しました。もう一度お試しください。");
      }
    })();
  }, [router, sb, sp, next]);
  // ===== ここまで追加 =====

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);
    router.replace(next);
  }

  async function onForgot() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr("メールアドレスを入力してください");
      return;
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const redirectTo = `${site}/auth/callback?next=/login?reset=1`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setErr(error ? error.message : "パスワード再設定メールを送信しました。");
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">ご利用中の方（ログイン）</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button className="w-full rounded bg-white/10 px-4 py-2 hover:bg-white/15">
          ログイン
        </button>
      </form>

      <button
        onClick={onForgot}
        className="w-full text-sm underline opacity-80 hover:opacity-100"
      >
        パスワードをお忘れですか？
      </button>

      <div className="text-sm opacity-70">
        はじめての方は{" "}
        <a className="underline" href="/register">新規登録へ</a>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
