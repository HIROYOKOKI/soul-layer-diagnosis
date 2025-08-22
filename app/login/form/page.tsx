'use client'

import { useState, type FormEvent } from 'react'

export default function LoginFormPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // まずはUI確認の仮処理（ここをSupabase連携に差し替え）
      await new Promise((r) => setTimeout(r, 600))
      setDone(true)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={page}>
      <section style={card} aria-live="polite">
        <h1 style={title}>ログイン</h1>
        {!done ? (
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
            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? '送信中…' : 'ログインリンクを送る'}
            </button>
            {error && <p style={errorText}>{error}</p>}
            <p style={hint}>※ 入力後、メールの受信箱をご確認ください。</p>
          </form>
        ) : (
          <div style={{display:'grid', gap:8}}>
            <p style={{margin:0}}>送信しました。メールのリンクからログインを完了してください。</p>
            <a href="/login" style={linkBtn}>戻る</a>
          </div>
        )}
      </section>

      {/* 背景は入口ページと共通トーン */}
      <div style={bg} aria-hidden>
        <div style={aura}/>
        <div style={aura2}/>
      </div>

      <style jsx>{`
        @media (max-width: 420px) {
          section { width: calc(100% - 28px); }
        }
        @keyframes pulse { 0%{transform:scale(.98);opacity:.7}50%{transform:scale(1.02);opacity:1}100%{transform:scale(.98);opacity:.7} }
        @keyframes drift { 0%{transform:translateY(0)}50%{transform:translateY(-12px)}100%{transform:translateY(0)} }
      `}</style>
    </main>
  )
}

/* ===== styles ===== */
const page = {
  minHeight:'100dvh',
  display:'grid',
  placeItems:'center',
  background:'#0b0b0b',
  color:'#fff',
} as const

const card = {
  width: 360,
  display:'grid',
  gap:12,
  padding:'28px 24px 24px',
  borderRadius:18,
  background:'rgba(255,255,255,0.04)',
  border:'1px solid rgba(255,255,255,0.08)',
  backdropFilter:'blur(2px)',
  boxShadow:'0 10px 40px rgba(0,0,0,.35)',
} as const

const title = { margin:0, fontSize:22, fontWeight:700 } as const
const form = { display:'grid', gap:12 } as const
const label = { fontSize:12, opacity:.8 } as const
const input = {
  padding:'12px 14px',
  borderRadius:10,
  border:'1px solid #333',
  background:'#111',
  color:'#fff',
  outline:'none',
  transition:'box-shadow .15s ease, border-color .15s ease',
  boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)',
} as const

const primaryBtn = {
  padding:'12px 14px',
  borderRadius:9999,
  border:'none',
  background:'#1e90ff',
  color:'#fff',
  cursor:'pointer',
} as const

const errorText = { color:'#ff7a7a', margin:0 } as const
const hint = { margin:0, fontSize:12, opacity:.7 } as const
const linkBtn = {
  display:'inline-block',
  padding:'10px 14px',
  borderRadius:9999,
  border:'1px solid rgba(255,255,255,.2)',
  color:'#fff',
  textDecoration:'none',
  background:'transparent',
} as const

const bg = {
  position:'fixed' as const,
  inset:0,
  zIndex:-1,
  pointerEvents:'none' as const,
  background:'radial-gradient(50% 40% at 50% 60%, #112233 0%, #000 70%)',
}
const aura = {
  position:'absolute' as const, left:'50%', top:'45%',
  width:360, height:360, transform:'translate(-50%, -50%)',
  borderRadius:'50%',
  background:'radial-gradient(circle, rgba(79,195,255,.3), rgba(0,0,0,0) 60%)',
  filter:'blur(20px)',
  animation:'pulse 5s ease-in-out infinite',
}
const aura2 = {
  position:'absolute' as const, left:'65%', top:'25%',
  width:220, height:220, borderRadius:'50%',
  background:'radial-gradient(circle, rgba(255,79,223,.24), rgba(0,0,0,0) 60%)',
  filter:'blur(16px)',
  animation:'drift 7s ease-in-out infinite',
}
