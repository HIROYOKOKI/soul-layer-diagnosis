// app/signup/page.tsx
"use client";
import AuthForm from "../auth/AuthForm";
import { useSearchParams } from "next/navigation";

export default function SignupPage() {
  const params = useSearchParams();
  const sent = params.get("sent")==="1";
  return (
    <main className="min-h-[100dvh] grid place-items-center text-white">
      <section className="w-[380px] p-6 rounded-2xl bg-white/5 border border-white/10">
        <h1 className="text-2xl font-semibold mb-3">新規登録</h1>
        {sent && <p className="text-emerald-300 text-sm mb-2">確認メールを送信しました。受信箱のリンクを開いて本登録を完了してください。</p>}
        <AuthForm mode="signup" signupRedirectBack="/signup?sent=1" />
        <p className="text-sm opacity-70 mt-3">すでにアカウントをお持ちの方は <a href="/login" className="underline text-sky-300">ログイン</a></p>
      </section>
    </main>
  );
}
