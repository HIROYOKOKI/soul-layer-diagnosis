'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type IssueResp = {
  ok: boolean
  item?: { code: string; tier: string; created_at: string }
  error?: string
}

export default function RegisterFormClient() {
  // ====== 状態管理 ======
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<{ code: string; tier: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Supabase クライアント生成（ブラウザ専用）
  const supabase = createClientComponentClient()

  // ====== 登録処理 ======
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setIssued(null)
    setMessage(null)

    try {
      // リダイレクト先URLを自動的に現在originに合わせる
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soul-layer-diagnosis.vercel.app'

      // サインアップ処理（メール確認付き）
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`, // ←ここが超重要
        },
      })
      if (signErr) throw signErr

      const userId = data.user?.id
      if (!userId) {
        setMessage('確認メールを送信しました。メールのリンクを開いて登録を完了してください。')
        setLoading(false)
        return
      }

      // 任意：登録完了後にメンバーコードを発行
      const res = await fetch('/api/membership/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: 'beta' }),
      })
      const j = (await res.json()) as IssueResp
      if (!j.ok || !j.item) throw new Error(j.error || 'issue_failed')

      setIssued({ code: `β-${j.item.code}`, tier: j.item.tier })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'unknown_error')
    } finally {
      setLoading(false)
    }
  }

  // ====== メール再送 ======
  async function resendEmail() {
    if (!email) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soul-layer-diagnosis.vercel.app'

      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      })
      if (resendErr) throw resendErr
      setMessage('確認メールを再送しました。迷惑メール・プロモーションタブも確認してください。')
    } catch (err: any) {
      setError(err?.message || 'resend_failed')
    } finally {
      setLoading(false)
    }
  }

  // ====== UI ======
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ====== メールアドレス ====== */}
      <div>
        <label className="block text-sm mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-zinc-900/60 px-4 py-2 ring-1 ring-white/10
                     focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* ====== パスワード ====== */}
      <div>
        <label className="block text-sm mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl bg-zinc-900/60 px-4 py-2 ring-1 ring-white/10
                     focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* ====== 登録ボタン ====== */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-white/10 backdrop-blur px-4 py-2
                   hover:bg-white/15 transition disabled:opacity-60"
      >
        {loading ? '登録中…' : '登録してコード発行'}
      </button>

      {/* ====== 再送ボタン ====== */}
      <button
        type="button"
        onClick={resendEmail}
        disabled={loading || !email}
        className="w-full rounded-2xl bg-emerald-800/30 backdrop-blur px-4 py-2
                   text-emerald-300 text-sm hover:bg-emerald-700/40 transition disabled:opacity-40"
      >
        確認メールを再送する
      </button>

      {/* ====== メッセージ／エラー表示 ====== */}
      {message && <div className="rounded-xl bg-emerald-900/40 px-4 py-2 text-sm">{message}</div>}
      {error && <div className="rounded-xl bg-red-900/40 px-4 py-2 text-sm">{error}</div>}

      {/* ====== 発行結果 ====== */}
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
