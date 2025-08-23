'use client'

import { useState, type FormEvent } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const supabase = getBrowserSupabase()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/` }, // サイトURL
    })
    if (error) setError(error.message)
    else alert('確認メールを送りました！受信して確認してください。')
  }

  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'100vh' }}>
      <form onSubmit={handleSubmit} style={{ display:'grid', gap:12 }}>
        <h1>新規登録テスト</h1>
        <input
          type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password" placeholder="password"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">登録</button>
        {error && <p style={{ color:'red' }}>{error}</p>}
      </form>
    </main>
  )
}
