"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const sb = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // /login?next=/mypage のようにクエリで遷移先を指定（既定は /theme）
  const nextPath = searchParams.get("next") || "/mypage";

  // 本番/ローカルのどちらでも安全に絶対URLを作る
  const site = useMemo(() => {
    if (typeof window !== "undefined") return location.origin;
    // SSR フォールバック（Vercel 環境変数があれば優先）
    return process.env.NEXT_PUBLIC_SITE_URL || "https://soul-layer-diagnosis.vercel.app";
  }, []);

  const redirectTo = useMemo(
    () => `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    [site, nextPath]
  );

  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingGithub, setSendingGithub] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    if (sendingEmail) return;
    setSendingEmail(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg("メールを送信しました。届いたリンクを開いてログインを完了してください。");
    } catch (e: any) {
      setErr(e?.message || "メール送信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setSendingEmail(false);
    }
  }

  async function signInGithub() {
    if (sendingGithub) return;
    setSendingGithub(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo },
      });
      if (error) throw error;
      // 以降はGitHubへリダイレクト → /auth/callback → nextPath へ
    } catch (e: any) {
      const m = String(e?.message || "");
      if (m.includes("Unsupported provider")) {
        setErr("GitHub連携が未有効です。Supabase の Authentication > Providers で GitHub を有効化してください。");
      } else {
        setErr(m || "GitHubログインで問題が発生しました。");
      }
      setSendingGithub(false);
    }
  }

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <p className="text-sm text-white/70 mt-1">
        ログイン後は <span className="underline">{nextPath}</span> に移動します。
      </p>

      {/* メールログイン */}
      <form onSubmit={signInEmail} className="mt-4 space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-white/20 bg-transparent p-2"
          required
        />
        <button
          disabled={sendingEmail || !email}
          className={[
            "rounded px-3 py-2 font-medium",
            sendingEmail ? "bg-white/40 text-black" : "bg-white text-black hover:opacity-90",
          ].join(" ")}
        >
          {sendingEmail ? "送信中…" : "メールでログイン"}
        </button>
      </form>

      {/* OAuth */}
      <div className="mt-6">
        <button
          onClick={signInGithub}
          disabled={sendingGithub}
          className={[
            "rounded border border-white/30 px-3 py-2",
            sendingGithub ? "opacity-60" : "hover:bg-white/10",
          ].join(" ")}
        >
          {sendingGithub ? "リダイレクト中…" : "GitHubでログイン"}
        </button>
      </div>

      {/* メッセージ/エラー */}
      {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}

      {/* 補助リンク */}
      <div className="mt-8 text-xs text-white/60">
        ログイン後に自動でページが切り替わらない場合は{" "}
        <button
          onClick={()=>router.push(nextPath)}
          className="underline underline-offset-2 hover:text-white"
        >
          こちら
        </button>
        を押してください。
      </div>
    </main>
  );
}
