"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

/** ブラウザ用 Supabase クライアント（公開キー必須） */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginFormPage() {
  const router = useRouter();
  const params = useSearchParams();

  // ?mode=signup でタブ初期値を登録側に
  const initialMode = (params.get("mode") === "signup" ? "signup" : "login") as
    | "login"
    | "signup";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // サインアップ時のメールリンク遷移先
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const origin = window.location.origin;
    // 本登録後、このURLに戻す（Supabase Auth 設定に要登録）
    return `${origin}/login/form?verified=1`;
  }, []);

  useEffect(() => {
    // 直リンクで戻って来た時の案内
    if (params.get("verified") === "1") {
      setInfo("メール確認が完了しました。ログインできます。");
      setMode("login");
    }
    if (params.get("reset") === "ok") {
      setInfo("パスワード再設定が完了しました。新しいパスワードでログインしてください。");
      setMode("login");
    }
  }, [params]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push("/mypage"); // ログイン後の遷移
      } else {
        // ここが「メール送信→本登録」フロー
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectTo, // ← ここ超重要
          },
        });
        if (error) throw error;
        setInfo("確認メールを送信しました。受信箱のリンクを開いて本登録を完了してください。");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      setError(humanizeAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    setError(null);
    setInfo(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email || "", {
        redirectTo: `${origin}/login/form?reset=ok`,
      });
      if (error) throw error;
      setInfo("再設定メールを送信しました。受信箱をご確認ください。");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "メール送信に失敗しました";
      setError(humanizeAuthError(msg));
    }
  };

  return (
    <main style={page}>
      <section style={card} aria-live="polite">
        <h1 style={title}>{mode === "login" ? "ログイン" : "新規登録"}</h1>

        <div style={tabs}>
          <button
            type="button"
            onClick={() => setMode("login")}
            aria-pressed={mode === "login"}
            style={{ ...tabBtn, ...(mode === "login" ? tabActive : null) }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
            style={{ ...tabBtn, ...(mode === "signup" ? tabActive : null) }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} style={form}>
          <label htmlFor="email" style={label}>メールアドレス</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={input}
          />

          <label htmlFor="password" style={label}>パスワード</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="8文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ ...input, paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
              style={pwToggle}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "処理中…" : mode === "login" ? "ログイン" : "登録する"}
          </button>

          {mode === "login" && (
            <button type="button" onClick={sendReset} style={linkBtn}>
              パスワードをお忘れですか？
            </button>
          )}

          {info && <p style={{ ...infoText }}>{info}</p>}
          {error && <p style={errorText}>{error}</p>}
        </form>

        <p style={hint}>
          ※ 新規登録は確認メールのリンクを開いて本登録完了となります。
        </p>
      </section>

      {/* 背景（簡易） */}
      <div style={bg} aria-hidden>
        <div style={aura} />
        <div style={aura2} />
      </div>

      <style jsx>{`
        @media (max-width: 420px) { section { width: calc(100% - 28px); } }
        @keyframes pulse { 0%{transform:scale(.98);opacity:.7}50%{transform:scale(1.02);opacity:1}100%{transform:scale(.98);opacity:.7} }
        @keyframes drift { 0%{transform:translateY(0)}50%{transform:translateY(-12px)}100%{transform:translateY(0)} }
      `}</style>
    </main>
  );
}

/* ===== メッセージ整形 ===== */
function humanizeAuthError(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "メールまたはパスワードが違います";
  if (/Email not confirmed/i.test(msg)) return "メール確認が未完了です。受信箱をご確認ください";
  if (/too many requests/i.test(msg)) return "試行回数が多すぎます。少し待ってから再度お試しください";
  return msg;
}

/* ===== styles ===== */
const page = { minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "#fff" } as const;
const card = { width: 380, display: "grid", gap: 12, padding: "28px 24px 24px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(2px)", boxShadow: "0 10px 40px rgba(0,0,0,.35)" } as const;
const title = { margin: 0, fontSize: 22, fontWeight: 700 } as const;
const tabs = { display: "flex", gap: 8 } as const;
const tabBtn = { flex: 1, padding: "8px 10px", borderRadius: 9999, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13 } as const;
const tabActive = { background: "rgba(255,255,255,.09)" } as const;
const form = { display: "grid", gap: 12 } as const;
const label = { fontSize: 12, opacity: 0.8 } as const;
const input = { padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", outline: "none", transition: "box-shadow .15s ease, border-color .15s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" } as const;
const pwToggle = { position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 16, lineHeight: 1 } as const;
const primaryBtn = { padding: "12px 14px", borderRadius: 9999, border: "none", background: "#1e90ff", color: "#fff", cursor: "pointer" } as const;
const linkBtn = { marginTop: 4, alignSelf: "start" as const, background: "transparent", border: "none", color: "#9dc9ff", cursor: "pointer", textDecoration: "underline" } as const;
const infoText = { color: "#a6f3c6", margin: 0, fontSize: 12 } as const;
const errorText = { color: "#ff7a7a", margin: 0 } as const;
const hint = { margin: 0, fontSize: 12, opacity: 0.7 } as const;
const bg = { position: "fixed" as const, inset: 0, zIndex: -1, pointerEvents: "none" as const, background: "radial-gradient(50% 40% at 50% 60%, #112233 0%, #000 70%)" };
const aura = { position: "absolute" as const, left: "50%", top: "45%", width: 360, height: 360, transform: "translate(-50%, -50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,255,.28), rgba(0,0,0,0) 60%)", filter: "blur(20px)", animation: "pulse 5s ease-in-out infinite" };
const aura2 = { position: "absolute" as const, left: "65%", top: "25%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,79,223,.22), rgba(0,0,0,0) 60%)", filter: "blur(16px)", animation: "drift 7s ease-in-out infinite" };
