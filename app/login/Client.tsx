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
    // ※ callback route がPOST対応している前提
    const res = await fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event, session }),
      cache: "no-store",
    });

    // 失敗時は原因が分かるようにする（黙殺しない）
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`syncCookie_failed: ${res.status} ${text}`.trim());
    }
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
      // OAuth はSupabase側でリダイレクトが走るのでここでは何もしない
    } catch (e: any) {
      setMsg(e?.message ?? "Googleログインに失敗しました。");
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

      // テスト時にメール確認OFFなら、ここで即ログイン状態になり得る
      setMsg(
        error
          ? error.message
          : "確認メールを送信しました。メールボックスを確認してください。"
      );
    } catch (e: any) {
      setMsg(e?.message ?? "新規登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      setMsg(null);

      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // ① cookie 同期（サーバー側APIが user を取れるようにする）
      await syncCookie("SIGNED_IN", data.session);

      // ② App Routerのサーバー側状態を更新（これが効く）
      router.refresh();

      // ③ 遷移
      router.replace(safeNext);
    } catch (e: any) {
      setMsg(
        e?.message ??
          "ログインに失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setMsg(null);

      await sb.auth.signOut();

      // cookie 同期
      await syncCookie("SIGNED_OUT");

      router.refresh();
      router.replace("/");
    } catch (e: any) {
      setMsg(e?.message ?? "ログアウトに失敗しました。");
    } finally {
      setLoading(false);
    }
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
        autoComplete="email"
      />
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        type="password"
        placeholder="パスワード"
        className="w-full rounded border px-3 py-2 bg-white/5"
        autoComplete="current-password"
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
        disabled={loading}
      >
        ログアウト
      </button>

      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
