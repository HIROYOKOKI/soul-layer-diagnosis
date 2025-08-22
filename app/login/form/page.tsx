'use client'

import { useState, type FormEvent } from 'react'
// Supabaseを使う場合は次の行を有効化（ブラウザだけで動かす実装）
// import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function LoginFormPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // （まずは仮処理でビルドを通す）
      // ↓ Supabase導入時の例：
      // const supabase = await getBrowserSupabase()
      // const { error } = await supabase.auth.signInWithOtp({ email })
      // if (error) throw error
      alert(`仮ログイン: ${email}`)
    } catch (err: unknown) {
      // anyを使わず安全に絞り込み
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Unknown error')
            : 'ログインに失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b0b0b',
        color: '#fff',
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, width: 320 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>ログイン</h1>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111',
            color: '#fff',
          }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 14px',
            borderRadius: 9999,
            border: 'none',
            background: '#1e90ff',
            color: '#fff',
          }}
        >
          {loading ? '送信中…' : '送信（仮）'}
        </button>
        {error && <p style={{ color: '#f77', margin: 0 }}>{error}</p>}
      </form>
    </main>
  )
}
