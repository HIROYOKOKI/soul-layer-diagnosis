// app/login/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/** 開発者メモ：
 * - URLに next クエリがあれば、ログイン成功後にそこへ遷移（/ で始まるパスのみ許可）
 * - Magic Link / Confirm Signup / Recovery のコールバックもこのページで受けて next へ
 * - フォールバック遷移先は /mypage
 */

export default function LoginPage() {
  const sb = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  /* ===== next の安全化（外部URLは拒否） ===== */
  const safeNext = useMemo(() => {
    const raw = sp.get("next") || "/mypage";
    try {
      // 先頭が "/" のパスだけ許可（"//evil.com" なども弾く）
      return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/mypage";
    } catch {
      return "/mypage";
    }
  }, [sp]);

  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(sp.get("err"));
  const [sending, setSending] = useState(false);

  /* ====== MagicLink / OTP（/login 自身で受けるブリッジ） ====== */
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        const code = sp.get("code");                 // PKCE / OAuth Code
        const type = (sp.get("type") || "").toLowerCase(); // signup, magiclink, recovery, ...
        const token_hash = sp.get("token_hash");     // confirm などで来る
        const token = sp.get("token");               // 稀に token で来る

        // 1) PKCE / OAuth code
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace(safeNext);
          return;
        }

        // 2) Email OTP（Magic Link / Confirm Signup / Recovery など）
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
          router.replace(safeNext);
          return;
        }
      } catch (e: any) {
        // 失敗しても通常ログインにフォールバック
        console.error("[login callback]", e);
        setErr(e?.message ?? "ログインリンクの処理に失敗しました。もう一度お試しください。");
      }
    })();
  }, [router, sb, sp, safeNext]);

  /* ====== パスワードログイン ====== */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErr(null);

    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setErr(error.message);
        return;
      }
      router.replace(safeNext);
    } catch (e: any) {
      setErr(e?.message ?? "ログインに失敗しました。時間をおいて再試行してください。");
    } finally {
      setSending(false);
    }
  }

  /* ====== パスワードリセット ====== */
  async function onForgot() {
    setErr(null);
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr("メールアドレスを入力してください");
      return;
    }
    try {
      const site =
        (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const origin = (site || "http://localhost:3000").replace(/\/+$/, "");
      // リセット完了後は /login?reset=1 に戻す
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/login?reset=1")}`;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      setErr(error ? error.message : "パスワード再設定メールを送信しました。");
    } catch (e: any) {
      setErr(e?.message ?? "メール送信に失敗しました。時間をおいて再試行してください。");
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">ご利用中の方（ログイン）</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2 bg-black/20"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 bg-black/20"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button
          className="w-full rounded bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-50"
          disabled={sending}
        >
          {sending ? "ログイン中…" : "ログイン"}
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
