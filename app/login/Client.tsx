// app/login/Client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Props = {
  next?: string;
};

export default function LoginClient({ next }: Props) {
  const sb = getBrowserSupabase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** 安全な next（アプリ内部パスだけ許可） */
  const safeNext = useMemo(() => {
    const raw = next || "/mypage";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/mypage";
  }, [next]);

  /** Supabase の OAuth / Magic Link 用 redirectTo */
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
          safeNext
        )}`
      : "";

  async function syncCookie(
    event: "SIGNED_IN" | "TOKEN_REFRESHED" | "SIGNED_OUT",
    session?: any
  ) {
    await fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event, session }),
    });
  }

  const signInGoogle = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) setMsg(error.message);
      // OAuth の場合は Supabase 側でリダイレクトが走るのでここでは何もしない
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const { error } = await sb.auth.signUp({
        email,
        password: pass,
        options: redirectTo ? { emailRedirectTo: redirectTo } : {},
      });
      setMsg(error ? error.message : "確認メールを送信しました。メールボックスを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        setMsg(error.message);
        return;
      }
      // cookie 同期
      await syncCookie("SIGNED_IN", data.session);
      // ✅ ログイン成功後は safeNext へ
      router.replace(safeNext);
    } catch (e: any) {
      setMsg(e?.message ?? "ログインに失敗しました。時間をおいて再試行してください。");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await sb.auth.signOut();
    await syncCookie("SIGNED_OUT");
    router.replace("/"); // or location.reload()
  };

  return (
    <div className="space-y-3">
      <button
        onClick={signInGoogle}
        className="w-full rounded bg-white text-black py-2"
        disabled={loading}
      >
        Googleで続ける
      </button>

      <div className="h-px bg-white/10" />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メール"
        className="w-full rounded border px-3 py-2 bg-white/5"
      />
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        type="password"
        placeholder="パスワード"
        className="w-full rounded border px-3 py-2 bg-white/5"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={signUp}
          className="rounded border px-3 py-2"
          disabled={loading}
        >
          新規登録
        </button>
        <button
          onClick={signIn}
          className="rounded bg-white text-black px-3 py-2"
          disabled={loading}
        >
          ログイン
        </button>
      </div>

      <button
        onClick={signOut}
        className="text-xs text-white/60 underline"
      >
        ログアウト
      </button>

      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
