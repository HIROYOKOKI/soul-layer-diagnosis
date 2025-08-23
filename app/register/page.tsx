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
    const supabase = await getBrowserSupabase()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else alert('確認メールを送信しました。')
  }

  return (
    <main style={{ minHeight:'100vh', display:'grid', placeItems:'center' }}>
      <form onSubmit={handleSubmit} style={{ display:'grid', gap:12 }}>
        <h1>新規登録</h1>
        <input type="email" placeholder="you@example.com"
               value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input type="password" placeholder="8文字以上"
               value={password} onChange={(e)=>setPassword(e.target.value)}
               required minLength={8} />
        <button type="submit">アカウント作成</button>
        {error && <p style={{ color:'red' }}>{error}</p>}
      </form>
    </main>
  )
}
