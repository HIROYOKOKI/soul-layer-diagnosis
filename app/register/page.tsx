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

    // ★ ここを await で受け取る
    const supabase = await getBrowserSupabase()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`, // ← コールバックへ
      },
    })
    if (error) setError(error.message)
    else alert('確認メールを送りました！メール内のリンクを開いてください。')
  }

  return (
    <main>
      {/* 省略：フォームUI */}
      <form onSubmit={handleSubmit}>{/* ... */}</form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}
