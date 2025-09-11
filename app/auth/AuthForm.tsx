// app/auth/AuthForm.tsx
"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthForm({
  mode, redirectToAfterLogin, signupRedirectBack,
}: {
  mode: "login" | "signup";
  redirectToAfterLogin?: string;       // 既定: /mypage
  signupRedirectBack?: string;         // 既定: /signup?sent=1
}) {
  const router = useRouter();
  const [email,setEmail]=useState(""); 
  const [password,setPassword]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState<string|null>(null);
  const [err,setErr]=useState<string|null>(null);

  const loginNext = redirectToAfterLogin ?? "/mypage";
  const signupBack = signupRedirectBack ?? "/signup?sent=1";
  const emailRedirectTo =
    typeof window!=="undefined" ? `${location.origin}/login?verified=1` : undefined;

  async function onSubmit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null); setMsg(null);
    try {
      if (mode==="login") {
        const { error } = await sb.auth.signInWithPassword({ email:email.trim(), password });
        if (error) throw error;
        router.push(loginNext);
      } else {
        const { error } = await sb.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo },
        });
        if (error) {
          if (/already|exists|duplicate/i.test(error.message)) {
            setMsg("このメールは登録済みです。ログインしてください。");
            router.push(`/login?email=${encodeURIComponent(email)}`);
            return;
          }
          throw error;
        }
        router.push(signupBack); // 送信完了画面へ
      }
    } catch(e:any){ setErr(e?.message ?? "エラーが発生しました"); }
    finally{ setLoading(false); }
  }

  async function sendReset() {
    setErr(null); setMsg(null);
    const origin = typeof window!=="undefined"?location.origin:"";
    const { error } = await sb.auth.resetPasswordForEmail(email||"", {
      redirectTo: `${origin}/login?reset=ok`,
    });
    if (error) setErr(error.message); else setMsg("再設定メールを送信しました。");
  }

  async function resend() {
    setErr(null); setMsg(null);
    const { error } = await sb.auth.resend({
      type: "signup", email: email.trim(), options: { emailRedirectTo },
    });
    if (error) setErr(error.message); else setMsg("確認メールを再送しました。");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input placeholder="you@example.com" value={email}
             onChange={e=>setEmail(e.target.value)} className="rounded px-3 py-2 bg-black/40 border border-white/20"/>
      <div className="relative">
        <input
          type={showPw?"text":"password"} placeholder="8文字以上"
          value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full rounded px-3 py-2 bg-black/40 border border-white/20 pr-10" minLength={8}/>
        <button type="button" onClick={()=>setShowPw(v=>!v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xl"> {showPw?"🙈":"👁️"} </button>
      </div>

      <button disabled={loading} className="rounded bg-white text-black py-2">
        {loading ? "処理中…" : mode==="login" ? "ログイン" : "登録する"}
      </button>

      {mode==="login" && (
        <button type="button" onClick={sendReset} className="text-sky-300 underline text-sm justify-self-start">
          パスワードをお忘れですか？
        </button>
      )}
      {mode==="signup" && (
        <button type="button" onClick={resend} className="text-sky-300 underline text-sm justify-self-start">
          確認メールを再送する
        </button>
      )}

      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
      {err && <p className="text-rose-400 text-sm">{err}</p>}
    </form>
  );
}
