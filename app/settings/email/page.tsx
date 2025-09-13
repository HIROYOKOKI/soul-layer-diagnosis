"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function EmailSettingsPage() {
  const sb = getBrowserSupabase();
  const router = useRouter();
  const sp = useSearchParams();

  // 現在のユーザー
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState(true);

  // 入力
  const [newEmail, setNewEmail] = useState("");
  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(newEmail), [newEmail]);

  // 再認証
  const [needReauth, setNeedReauth] = useState(false);
  const [reauthEmail, setReauthEmail] = useState("");
  const [reauthPwd, setReauthPwd] = useState("");
  const [busy, setBusy] = useState(false);

  // メッセージ
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ロード：現在のメール
  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      const email = data.user?.email ?? "";
      setCurrentEmail(email);
      setReauthEmail(email);
      setLoadingUser(false);
    })();
  }, [sb]);

  // 確認リンクから戻ってきたときの完了表示（任意）
  useEffect(() => {
    const status = sp.get("status");
    if (status === "confirmed") {
      setMsg("メールアドレスの変更が完了しました。");
    }
  }, [sp]);

  async function onSubmitChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setMsg(null); setErr(null);

    try {
      const { error } = await sb.auth.updateUser({ email: newEmail });
      if (error) {
        // よくある：再認証が必要
        if (
          /reauth|re-auth|requires reauthentication|confirm your identity/i.test(
            error.message || ""
          )
        ) {
          setNeedReauth(true);
          setErr("本人確認のため、再度ログインしてください。");
        } else {
          throw error;
        }
      } else {
        setMsg("確認メールを送信しました。新しいメールの受信箱をご確認ください。");
      }
    } catch (e: any) {
      setErr(e?.message ?? "変更に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  // パスワードで再認証 → 再度 updateUser を試す
  async function onReauth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(null);
    try {
      const { error } = await sb.auth.signInWithPassword({
        email: reauthEmail,
        password: reauthPwd,
      });
      if (error) throw error;

      // 再試行
      const { error: upErr } = await sb.auth.updateUser({ email: newEmail });
      if (upErr) throw upErr;

      setNeedReauth(false);
      setMsg("確認メールを新しいアドレスへ送信しました。受信箱をご確認ください。");
    } catch (e: any) {
      setErr(e?.message ?? "再認証に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  // Magic Link で再認証（パスワード不要の代替）
  async function onReauthByMagicLink() {
    setBusy(true); setMsg(null); setErr(null);
    try {
      const origin = window.location.origin;
      const { error } = await sb.auth.signInWithOtp({
        email: currentEmail,
        options: { emailRedirectTo: `${origin}/settings/email?reauth=1` },
      });
      if (error) throw error;
      setMsg("確認メールを送信しました。届いたリンクから再認証してください。");
    } catch (e: any) {
      setErr(e?.message ?? "送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  if (loadingUser) return null;

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">メールアドレスの変更</h1>

      <p className="text-sm opacity-80 mb-4">現在のメール：{currentEmail || "-"}</p>

      <form onSubmit={onSubmitChangeEmail} className="space-y-4">
        <label className="block text-sm opacity-80 mb-1">新しいメール</label>
        <input
          type="email"
          required
          placeholder="new@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />
        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
        >
          {busy ? "処理中…" : "確認メールを送る"}
        </button>
      </form>

      {needReauth && (
        <div className="mt-8 border rounded-md p-4">
          <h2 className="font-semibold mb-2">再認証が必要です</h2>
          <form onSubmit={onReauth} className="space-y-3">
            <input
              type="email"
              value={reauthEmail}
              onChange={(e) => setReauthEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <input
              type="password"
              value={reauthPwd}
              onChange={(e) => setReauthPwd(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              placeholder="パスワード"
              autoComplete="current-password"
            />
            <div className="flex gap-8">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
              >
                {busy ? "確認中…" : "パスワードで再認証"}
              </button>
              <button
                type="button"
                onClick={onReauthByMagicLink}
                disabled={busy}
                className="flex-1 rounded-md border py-2"
              >
                メールリンクで再認証
              </button>
            </div>
          </form>
        </div>
      )}

      {msg && <p className="mt-4 text-sm text-emerald-500">{msg}</p>}
      {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}

      <p className="mt-6 text-sm opacity-80">
        <a href="/mypage" className="underline">マイページへ戻る</a>
      </p>
    </div>
  );
}
