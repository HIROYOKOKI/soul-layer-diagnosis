// app/register/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function isValidEmail(v: string) {
  // ざっくり妥当性（+ や . を許容）
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function mapError(e: any): string {
  const msg = String(e?.message || e || "");
  if (/rate|limit/i.test(msg)) return "短時間に送信しすぎました。少し待ってから再試行してください。";
  if (/bounce|restricted|suspended|blocked/i.test(msg))
    return "送信が一時制限されています。時間を置くか、GitHubログインをご利用ください。";
  if (/invalid/i.test(msg)) return "メールアドレスが不正です。形式をご確認ください。";
  return msg || "送信に失敗しました。ネットワークをご確認のうえ再試行してください。";
}

export default function RegisterPage() {
  const sb = createClientComponentClient();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // 既定は /welcome（intro=1）。?next= があればそれを優先
  const nextParam = sp.get("next");
  const defaultNext = "/welcome?intro=1";
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : defaultNext;

  const site = useMemo(
    () => (typeof window !== "undefined" ? location.origin : (process.env.NEXT_PUBLIC_SITE_URL || "https://soul-layer-diagnosis.vercel.app")),
    []
  );
  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (sending || cooldown > 0) return;

    const addr = email.trim();
    if (!isValidEmail(addr)) {
      setErr("メールアドレスの形式が正しくありません。");
      return;
    }

    setSending(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email: addr,
        options: {
          emailRedirectTo: redirectTo, // ← 新規登録完了ボタンで /welcome へ
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。メール内の「登録を完了」ボタンを押してください。");
      setCooldown(60); // 連打抑止
    } catch (e: any) {
      setErr(mapError(e));
    } finally {
      setSending(false);
    }
  }

  const disabled = sending || !email || !isValidEmail(email) || cooldown > 0;

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-semibold">新規登録</h1>
      <p className="text-sm text-white/70 mt-1">
        登録完了後は <span className="underline">/welcome</span> に移動します。
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-2">
        <input
          className="w-full rounded border border-white/20 bg-transparent p-2"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button
          disabled={disabled}
          aria-disabled={disabled}
          className={[
            "rounded px-3 py-2 font-medium",
            disabled ? "bg-white/40 text-black cursor-not-allowed" : "bg-white text-black hover:opacity-90",
          ].join(" ")}
        >
          {sending ? "送信中…" : cooldown > 0 ? `再送は ${cooldown}s 後` : "登録用メールを送信"}
        </button>
      </form>

      {msg && <p className="mt-2 text-emerald-300 text-sm">{msg}</p>}
      {err && (
        <p className="mt-2 text-red-300 text-sm">
          {err}{" "}
          <a className="underline hover:opacity-80" href="/login?next=/welcome?intro=1">
            GitHubでログイン
          </a>{" "}
          も利用できます。
        </p>
      )}
    </main>
  );
}
