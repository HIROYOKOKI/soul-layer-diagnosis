"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type IssueResp = {
  ok: boolean
  item?: { code: string; tier: string; created_at: string }
  error?: string
}

export default function RegisterFormClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<{ code: string; tier: string } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setIssued(null)
    try {
      const supabase = getSupabaseBrowser() // ← lib/supabase-browser.ts に合わせて
      const { data: sign, error: e1 } = await supabase.auth.signUp({ email, password })
      if (e1) throw e1
      const userId = sign.user?.id
      if (!userId) throw new Error("user_not_created")

      const res = await fetch("/api/membership/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: "beta" }),
      })
      const j = (await res.json()) as IssueResp
      if (!j.ok || !j.item) throw new Error(j.error || "issue_failed")

      // 表示だけ β- を付ける（保存は ASCII: BEAK0001）
      setIssued({ code: `β-${j.item.code}`, tier: j.item.tier })
    } catch (err: any) {
      setError(err?.message || "unknown_error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-zinc-900/60 px-4 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl bg-zinc-900/60 px-4 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-white/10 backdrop-blur px-4 py-2 hover:bg-white/15 transition"
      >
        {loading ? "登録中…" : "登録してコード発行"}
      </button>

      {error && <div className="rounded-xl bg-red-900/40 px-4 py-2 text-sm">{error}</div>}

      {issued && (
        <div className="mt-4 rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 p-4">
          <div className="text-xs tracking-widest text-zinc-400">YOUR MEMBERSHIP CODE</div>
          <div className="mt-1 text-2xl font-semibold">{issued.code}</div>
          <div className="mt-1 text-sm text-zinc-400">Tier: {issued.tier}</div>
        </div>
      )}
    </form>
  )
}
