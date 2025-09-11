// app/register/page.tsx
"use client"

import { useState } from "react"
import { getBrowserSupabase } from "@/lib/supabase-admin" // 既存のブラウザ用を流用（名称そのまま）
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const sb = getBrowserSupabase()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    // 通常は signUp（メール確認フロー）。今回はテスト優先で signIn できる前提（管理者作成済み）
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push("/profile")
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">新規登録 / ログイン</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full bg-black/40 border border-white/20 rounded px-3 py-2"
          placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full bg-black/40 border border-white/20 rounded px-3 py-2"
          placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} className="w-full rounded bg-white text-black py-2">
          {loading ? "処理中…" : "続ける"}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <p className="text-xs text-white/60 mt-2">※ テスト中は管理者で事前作成→ここでログインが最短です。</p>
      </form>
    </div>
  )
}
