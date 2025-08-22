'use client'

import { useState } from 'react'

export default function LoginFormPage() {
  const [email, setEmail] = useState('')

  // ← 一旦は何もしない。ビルドが通ることを最優先
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    alert(`仮ログイン: ${email}`)
  }

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      background: '#0b0b0b',
      color: '#fff'
    }}>
      <form onSubmit={handleSubmit}
            style={{ display:'grid', gap:12, width: 320 }}>
        <h1 style={{margin:0, fontSize:20}}>ログイン</h1>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{ padding:'12px 14px', borderRadius:8, border:'1px solid #333', background:'#111', color:'#fff' }}
          required
        />
        <button type="submit"
          style={{ padding:'12px 14px', borderRadius:9999, border:'none', background:'#1e90ff', color:'#fff' }}>
          送信（仮）
        </button>
      </form>
    </main>
  )
}
