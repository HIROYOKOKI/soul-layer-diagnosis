"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const sb = getBrowserSupabase();
  const router = useRouter();

  // モード：email入力 -> new password 入力
  const [mode, setMode] = useState<"request" | "update">("request");

  // request 用
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email) && !sending, [email, sending]);

  // update 用
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [updating, setUpdating] = useState(false);

  // 共通メッセージ
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // メールのリンクを踏んで戻ってきた時、Supabase が一時セッションを張る
  useEffect(() => {
    const sub = sb.auth.onAuthStateChange((e) => {
      // v2では PASSWORD_RECOVERY というイベントは渡されず、直接 session が張られることが多い
      // ここではセッションの有無で update モードへ切り替える
      sb.auth.getSession().then(({ data }) => {
        if (data.session) setMode("update");
      });
    });
    // 初回もチェック
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setMode("update");
    });
    return () => sub.data.subscription.unsubscribe();
  }, [sb]);

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setMsg(null); setErr(null);
    try {
      const origin = window.location.origin;
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset`, // ここに戻す（Redirect URLsに登録必須）
      });
      if (error) throw error;
      setMsg("パスワード再設定メールを送信しました。受信箱をご確認ください。");
    } catch (e: any) {
      setErr(e?.message ?? "送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true); setMsg(null); setErr(null);
    try {
      if (pwd.length < 8) throw new Error("パスワードは8文字以上にしてください。");
      if (pwd !== pwd2) throw new Error("パスワードが一致しません。");
      const { error } = await sb.auth.updateUser({ password: pwd });
      if (error) throw error;
      setMsg("パスワードを更新しました。ログインページへ移動します。");
      // 好みで遷移先を調整
      setTimeout(() => router.replace("/login"), 800);
    } catch (e: any) {
      setErr(e?.message ?? "更新に失敗しました。もう一度お試しください。");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">パスワード再設定</h1>

      {mode === "request" ? (
        <form onSubmit={onRequest} className="space-y-4">
          <label className="block text-sm opacity-80 mb-1">メールアドレス</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-transparent"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
          >
            {sending ? "送信中…" : "再設定メールを送る"}
          </button>
        </form>
      ) : (
        <form onSubmit={onUpdate} className="space-y-4">
          <label className="block text-sm opacity-80 mb-1">新しいパスワード</label>
          <input
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-transparent"
            autoComplete="new-password"
            placeholder="8文字以上"
          />
          <label className="block text-sm opacity-80 mb-1">新しいパスワード（確認）</label>
          <input
            type="password"
            required
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-transparent"
            autoComplete="new-password"
            placeholder="もう一度入力"
          />
          <button
            type="submit"
            disabled={updating}
            className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
          >
            {updating ? "更新中…" : "パスワードを更新する"}
          </button>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-emerald-500">{msg}</p>}
      {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}

      <p className="mt-6 text-sm opacity-80">
        <a href="/login" className="underline">ログインへ戻る</a>
      </p>
    </div>
  );
}
