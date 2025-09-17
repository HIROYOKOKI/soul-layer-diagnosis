"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const sb = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const site = typeof window !== "undefined" ? location.origin : "https://soul-layer-diagnosis.vercel.app";
  const redirectTo = `${site}/auth/callback?next=/theme`;

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) alert(error.message);
    else setSent(true);
  }

  async function signInGithub() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: redirectTo },
    });
    if (error) alert(error.message);
  }

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-semibold">ログイン</h1>

      <form onSubmit={signInEmail} className="mt-4 space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-white/20 bg-transparent p-2"
        />
        <button className="rounded bg-white text-black px-3 py-2">メールでログイン</button>
      </form>

      {sent && <p className="mt-2 text-sm text-white/70">メールを確認してください。</p>}

      <div className="mt-6">
        <button onClick={signInGithub} className="rounded border border-white/30 px-3 py-2">
          GitHubでログイン
        </button>
      </div>
    </main>
  );
}
