// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.push("/profile");
    } catch (e: any) {
      setErr(e?.message ?? "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">新規登録 / ログイン</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full bg-black/40 border border-white/20 rounded px-3 py-2"
               placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full bg-black/40 border border-white/20 rounded px-3 py-2"
               placeholder="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading} className="w-full rounded bg-white text-black py-2">
          {loading ? "処理中…" : "続ける"}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </form>
    </div>
  );
}
