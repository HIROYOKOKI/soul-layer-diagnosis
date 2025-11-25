// app/login/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/** 開発メモ
 * - ?next=/xxxx があればログイン成功後そこへ遷移（/ で始まるパスのみ許可）
 * - Magic Link / Confirm Signup / Recovery もこのページで受けて next へ
 * - デフォルト遷移先は /mypage
 */

/* ===== 目アイコン付きパスワード入力 ===== */
function PasswordField({
  id = "password",
  value,
  onChange,
  placeholder = "パスワード",
  autoComplete = "current-password",
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded border px-3 py-2 bg-black/20 pr-12"
        aria-describedby={`${id}-toggle-help`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
        id={`${id}-toggle`}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-base opacity-80 hover:opacity-100 focus:outline-none"
      >
        {show ? "🙈" : "👁️‍🗨️"}
      </button>
      <span id={`${id}-toggle-help`} className="sr-only">
        目のボタンでパスワードの表示・非表示を切り替えられます
      </span>
    </div>
  );
}

export default function LoginPage() {
  const sb = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  /* ===== next の安全化（外部URLは拒否） ===== */
  const safeNext = useMemo(() => {
    const raw = sp.get("next") || "/mypage";
    // 先頭が "/" で始まり "//" は除外 → アプリ内パスだけ許可
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/mypage";
  }, [sp]);

  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(sp.get("err"));
  const [sending, setSending] = useState(false);

  /* ===== すでにログイン済みなら即 next へ ===== */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await sb.auth.getUser();
        if (data?.user) {
          router.replace(safeNext);
        }
      } catch {
        // 無視（通常ログインへ）
      }
    })();
    // safeNext が変わる事はない想定だが依存に入れておく
  }, [sb, router, safeNext]);

  /* ====== Magic Link / OTP コールバック処理 ====== */
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        const code = sp.get("code"); // PKCE / OAuth Code
        const type = (sp.get("type") || "").toLowerCase(); // signup, magiclink, recovery, ...
        const token_hash = sp.get("token_hash");
        const token = sp.get("token");

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
        console.error("[login callback]", e);
        setErr(
          e?.message ??
            "ログインリンクの処理に失敗しました。もう一度お試しください。"
        );
      }
    })();
  }, [router, sb, sp, safeNext]);

  /* ====== メール + パスワードログイン ====== */
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
      // ✅ 成功したら next へ
      router.replace(safeNext);
    } catch (e: any) {
      setErr(
        e?.message ?? "ログインに失敗しました。時間をおいて再試行してください。"
      );
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
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
        "/login?reset=1"
      )}`;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      setErr(
        error
          ? error.message
          : "パスワード再設定メールを送信しました。メールボックスを確認してください。"
      );
    } catch (e: any) {
      setErr(e?.message ?? "メール送信に失敗しました。時間をおいて再試行してください。");
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4 text-white">
      <h1 className="text-xl font-semibold">ご利用中の方（ログイン）</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border border-white/20 px-3 py-2 bg-black/20"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="パスワード"
          autoComplete="current-password"
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
        className="w-full text-sm underline opacity-80 hover:opacity-100 text-left"
      >
        パスワードをお忘れですか？
      </button>

      <div className="text-sm opacity-70">
        はじめての方は{" "}
        <a className="underline" href="/register">
          新規登録へ
        </a>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
