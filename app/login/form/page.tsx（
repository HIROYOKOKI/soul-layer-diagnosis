'use client'
import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginFormPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError('メールとパスワードを入力してください'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    // 成功：トップやマイページへ
    router.replace('/daily') // ←遷移先は好きなページに
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <h1 style={styles.title}>ログイン</h1>
        <form onSubmit={onSubmit} style={{ display:'grid', gap:14 }}>
          <GlassInput
            type="email" placeholder="メールアドレス"
            value={email} onChange={e=>setEmail(e.target.value)}
          />
          <GlassInput
            type="password" placeholder="パスワード"
            value={password} onChange={e=>setPassword(e.target.value)}
          />
          {error && <p style={{ color:'#fca5a5', fontSize:12 }}>{error}</p>}
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:6 }}>
            <DomeButton label={loading ? '処理中…' : 'ログイン'} variant="blue" asSubmit />
            <DomeButton label="戻る" variant="pink" onClick={()=>router.back()} />
          </div>
        </form>
        <p style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,.7)' }}>
          初めての方は <a href="/signup" style={{ color:'#93c5fd' }}>新規登録</a>
        </p>
      </div>
    </div>
  )
}

/* ====== UIパーツ ====== */
function GlassInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      border:'none', outline:'none', width:'min(320px, 84vw)',
      padding:'14px 16px', borderRadius:12, color:'#fff',
      background:'rgba(255,255,255,0.08)',
      boxShadow:'inset 0 1px 1px rgba(255,255,255,.18), inset 0 -2px 4px rgba(0,0,0,.55)',
      backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)'
    }} />
  )
}

// DomeButton: クリック時だけ強発光 / 通常は黒ドーム
function DomeButton({
  label, variant, onClick, asSubmit
}: {
  label: string; variant: 'pink'|'blue'; onClick?: ()=>void; asSubmit?: boolean
}) {
  const [pressed, setPressed] = useState(false)
  const glowColor = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'
  const glowShadow = `0 0 12px ${glowColor}, 0 0 24px ${glowColor}, 0 0 64px ${glowColor}`

  return (
    <div
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ display:'inline-block', borderRadius:9999, transform: pressed?'scale(.98)':'scale(1)', transition:'transform .12s ease' }}
    >
      <button type={asSubmit?'submit':'button'} onClick={onClick} style={{
        position:'relative', border:'none', outline:'none', cursor:'pointer',
        borderRadius:9999, padding:'12px 38px', minHeight:46, color:'#fff',
        letterSpacing:'.15em', fontSize:16, background:'#0a0a0a', overflow:'hidden',
        boxShadow: pressed ? glowShadow : 'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)'
      }}>
        {label}
        {/* ガラスのハイライト */}
        <span aria-hidden style={{
          position:'absolute', inset:0, borderRadius:9999,
          background:'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
          opacity:.3, pointerEvents:'none'
        }}/>
        {/* 押下時ネオン拡散 */}
        {pressed && (
          <span aria-hidden style={{
            position:'absolute', inset:-20, borderRadius:9999,
            background:`radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
            filter:'blur(18px)', animation:'neonPulse .4s ease-out'
          }}/>
        )}
        <style jsx>{`
          @keyframes neonPulse {
            0% { opacity: 1; transform: scale(0.8); }
            70%{ opacity: .7; transform: scale(1.2); }
            100%{ opacity: 0; transform: scale(1.4); }
          }
        `}</style>
      </button>
    </div>
  )
}

/* ====== styles ====== */
const styles = {
  root: {
    minHeight:'100dvh', background:'#000', color:'#fff',
    display:'grid', placeItems:'center'
  },
  card: {
    textAlign:'center' as const, padding:'28px 22px 34px',
    background:'rgba(0,0,0,.55)', borderRadius:16,
    boxShadow:'0 12px 32px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)'
  },
  title: { fontSize:22, fontWeight:600, marginBottom:16 }
}
