'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function LoginFormPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const supabase = await getBrowserSupabase() // ← 動的 import（ビルド時に走らない）
      // 例: OTPメール
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      alert('送信しました。メールをご確認ください。')
    } catch (err: any) {
      setError(err?.message ?? 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight:'100dvh', display:'grid', placeItems:'center', background:'#0b0b0b', color:'#fff' }}>
      <form onSubmit={handleSubmit} style={{ display:'grid', gap:12, width:320 }}>
        <h1 style={{margin:0, fontSize:20}}>ログイン</h1>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
               placeholder="you@example.com" required
               style={{ padding:'12px 14px', borderRadius:8, border:'1px solid #333', background:'#111', color:'#fff' }} />
        <button disabled={loading} type="submit"
                style={{ padding:'12px 14px', borderRadius:9999, border:'none', background:'#1e90ff', color:'#fff' }}>
          {loading ? '送信中…' : 'ログインリンクを送る'}
        </button>
        {error && <p style={{color:'#f77', margin:0}}>{error}</p>}
      </form>
    </main>
  )
}
