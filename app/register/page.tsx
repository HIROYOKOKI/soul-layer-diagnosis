// app/register/page.tsx
"use client";

import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function RegisterPage() {
  const sb = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const lenOk = pw.length >= 6;
  const matchOk = pw !== "" && pw === pw2;

  const can = useMemo(
    () => emailOk && lenOk && matchOk && !sending,
    [emailOk, lenOk, matchOk, sending]
  );

  async function ensureUserNo(userId: string) {
    // 既に user_no が入っていれば何もしない。無ければ簡易Noを付与
    try {
      const { data: prof } = await sb
        .from("profiles")
        .select("id, user_no")
        .eq("id", userId)
        .maybeSingle();

      if (prof?.user_no) return;

      const short = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
      const userNo = `U-${short}`;

      await sb
        .from("profiles")
        .upsert({ id: userId, user_no: userNo }, { onConflict: "id" });
    } catch {
      // 失敗してもフローは継続（後で付け直せるようにする）
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!can) return;

    setSending(true);
    setMsg(null);
    setErr(null);

    try {
      const site =
        (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const origin = (site || "http://localhost:3000").replace(/\/+$/, "");
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/welcome")}`;

      // 1) 新規登録
      const { error: signUpErr } = await sb.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: redirectTo },
      });

      if (!signUpErr) {
        // メール確認OFFならセッションが即時発行される
        const {
          data: { session },
        } = await sb.auth.getSession();

        if (session?.user?.id) {
          await ensureUserNo(session.user.id);
          window.location.href = "/welcome";
          return;
        }

        // メール確認ONの場合は案内のみ
        setMsg("確認メールを送信しました。メール内のリンクを開くと登録が完了します。");
        return;
      }

      // 2) 既に登録済み → パスワードで即ログインして /mypage
      const already =
        /already\s*registered/i.test(signUpErr.message) ||
        /既に.*登録|exist|taken/i.test(signUpErr.message);

      if (already) {
        const { error: signInErr, data } = await sb.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (signInErr) {
          setErr(signInErr.message);
          return;
        }
        const userId = data.user?.id;
        if (userId) await ensureUserNo(userId);
        window.location.href = "/mypage";
        return;
      }

      // 3) その他エラー
      setErr(signUpErr.message);
    } catch (e: any) {
      setErr(e?.message ?? "登録処理で不明なエラーが発生しました。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-5">
      <h1 className="text-xl font-semibold">はじめての方（新規登録）</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* email */}
        <div className="space-y-1">
          <label className="block text-sm opacity-80">メールアドレス</label>
          <input
            className="w-full rounded border px-3 py-2 bg-black/20"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* password */}
        <div className="space-y-1">
          <label className="block text-sm opacity-80">パスワード（6文字以上）</label>
          <div className="relative">
            <input
              className="w-full rounded border px-3 py-2 pr-12 bg-black/20"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg"
              onClick={() => setShowPw((v) => !v)}
              title={showPw ? "隠す 🙈" : "表示 👁️‍🗨️"}
            >
              {showPw ? "🙈" : "👁️‍🗨️"}
            </button>
          </div>
          {!lenOk && pw.length > 0 && (
            <p className="text-xs text-red-400">6文字以上で入力してください。</p>
          )}
        </div>

        {/* password confirm */}
        <div className="space-y-1">
          <label className="block text-sm opacity-80">パスワード（確認用）</label>
          <div className="relative">
            <input
              className="w-full rounded border px-3 py-2 pr-12 bg-black/20"
              type={showPw2 ? "text" : "password"}
              placeholder="••••••••"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPw2 ? "確認用パスワードを隠す" : "確認用パスワードを表示"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg"
              onClick={() => setShowPw2((v) => !v)}
              title={showPw2 ? "隠す 🙈" : "表示 👁️‍🗨️"}
            >
              {showPw2 ? "🙈" : "👁️‍🗨️"}
            </button>
          </div>
          {pw2.length > 0 && pw !== pw2 && (
            <p className="text-xs text-red-400">パスワードが一致しません。</p>
          )}
        </div>

        <button
          disabled={!can}
          className="w-full rounded bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-40"
        >
          登録
        </button>

        <div className="text-sm opacity-70">
          すでにアカウントをお持ちの方は{" "}
          <a className="underline" href="/login">ログインへ</a>
        </div>

        {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </form>
    </div>
  );
}
