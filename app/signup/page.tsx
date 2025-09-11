"use client";

import AuthForm from "@/app/auth/AuthForm";
import { useMemo } from "react";

export default function SignupPage() {
  // ❌ useSearchParams は使わない
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const sent = params.get("sent") === "1";

  return (
    <main className="min-h-[100dvh] grid place-items-center text-white">
      <section className="w-[380px] p-6 rounded-2xl bg-white/5 border border-white/10">
        <h1 className="text-2xl font-semibold mb-3">新規登録</h1>

        {sent && (
          <p className="text-emerald-300 text-sm mb-2">
            確認メールを送信しました。受信箱のリンクを開いて本登録を完了してください。
          </p>
        )}

        {/* 確認メール後の戻り先は /login/email?verified=1 に統一 */}
        <AuthForm
          mode="signup"
          emailRedirectBack={
            typeof window !== "undefined"
              ? `${window.location.origin}/login/email?verified=1`
              : undefined
          }
        />

        <p className="text-sm opacity-70 mt-3">
          すでにアカウントをお持ちの方は{" "}
          <a href="/login/email" className="underline text-sky-300">
            ログイン
          </a>
        </p>
      </section>
    </main>
  );
}
