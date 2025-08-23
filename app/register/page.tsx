'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!agree) return setError('利用規約に同意してください')
    if (password.length < 8) return setError('パスワードは8文字以上にしてください')
    if (password !== confirm) return setError('確認用パスワードが一致しません')

    setLoading(true)
    try {
      const supabase = await getBrowserSupabase()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登録に失敗しました'
      setError(humanizeAuthError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      {/* 背景（全面固定 + 暗幕） */}
     <div style={styles.bgStack} aria-hidden>
  <img src="/login-still.png" alt="" aria-hidden style={styles.bgMedia} />
  <div style={styles.bgOverlay} />
  <div style={styles.bgTopMask} />   {/* ← 追加：上部を確実に隠す */}
</div>

      {/* 中央カード */}
      <section style={styles.card} aria-live="polite">
        <h1 style={styles.title}>新規登録</h1>

        {!done ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label htmlFor="email" style={styles.label}>メールアドレス</label>
            <input
              id="email" type="email" inputMode="email" autoComplete="email"
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required style={styles.input}
            />

            <label htmlFor="password" style={styles.label}>パスワード</label>
            <div style={{ position:'relative' }}>
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8文字以上"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} style={{ ...styles.input, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
                style={styles.pwToggle}
              >{showPw ? '🙈' : '👁️'}</button>
            </div>

            <label htmlFor="confirm" style={styles.label}>パスワード（確認）</label>
            <input
              id="confirm" type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="もう一度入力"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required minLength={8} style={styles.input}
            />

            <label style={styles.checkRow}>
              <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
              <span>利用規約に同意します</span>
            </label>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? '作成中…' : 'アカウントを作成'}
            </button>

            {error && <p style={styles.errorText}>{error}</p>}

            <p style={styles.small}>
              すでにアカウントをお持ちですか？ <a href="/login/form" style={styles.link}>ログイン</a>
            </p>
          </form>
        ) : (
          <div style={{ display:'grid', gap:12 }}>
            <p style={{ margin:0 }}>登録メールを送信しました。受信箱をご確認ください。</p>
            <a href="/login/form" style={styles.linkBtn}>ログインページへ</a>
          </div>
        )}
      </section>
    </main>
  )
}

function humanizeAuthError(msg: string): string {
  if (/User already registered/i.test(msg)) return 'このメールは既に登録されています'
  if (/Email not confirmed/i.test(msg)) return 'メール確認が未完了です。受信箱をご確認ください'
  if (/Invalid email/i.test(msg)) return 'メールアドレスの形式が正しくありません'
  if (/too many requests/i.test(msg)) return '試行回数が多すぎます。しばらく待って再度お試しください'
  return msg
}

/* ===== styles ===== */
const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    background: '#000',
    color: '#fff',
    overflow: 'hidden',
  },                             // ← ← ここを必ず閉じる！（},）

  bgStack: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  bgMedia: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 82%', // 75–85%で微調整OK
    transform: 'translateZ(0)',
    willChange: 'transform',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.45) 100%)',
  },
  bgTopMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '24vh', // まだ残るなら 28vh にUP
    background:
      'linear-gradient(180deg, rgba(0,0,0,.95) 0%, rgba(0,0,0,.85) 60%, rgba(0,0,0,0) 100%)',
  },


  // カード（中央固定）
  card: {
    position:'relative',
    zIndex:1,
    width:380,
    maxWidth:'calc(100vw - 28px)',
    padding:'28px 24px 24px',
    display:'grid',
    gap:12,
    background:'rgba(0,0,0,.55)',
    border:'1px solid rgba(255,255,255,.1)',
    borderRadius:18,
    backdropFilter:'blur(4px)',
    boxShadow:'0 10px 40px rgba(0,0,0,.35)',
  },

  title: { margin:0, fontSize:22, fontWeight:700, letterSpacing:'.04em' },
  form: { display:'grid', gap:12 },
  label: { fontSize:12, opacity:.8 },
  input: {
    padding:'12px 14px',
    borderRadius:10,
    border:'1px solid #333',
    background:'#111',
    color:'#fff',
    outline:'none',
    transition:'box-shadow .15s ease, border-color .15s ease',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)',
  },
  pwToggle: {
    position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
    border:'none', background:'transparent', color:'#ccc', cursor:'pointer', fontSize:16, lineHeight:1,
  },
  checkRow: { display:'flex', alignItems:'center', gap:8, fontSize:13, opacity:.9 } as CSSProperties,
  primaryBtn: {
    padding:'12px 14px', borderRadius:9999, border:'none', background:'#1e90ff', color:'#fff', cursor:'pointer'
  },
  linkBtn: {
    display:'inline-block', padding:'10px 14px', borderRadius:9999, border:'1px solid rgba(255,255,255,.2)',
    color:'#fff', textDecoration:'none', background:'transparent', width:'fit-content'
  },
  link: { color:'#9dc9ff', textDecoration:'underline' },
  small: { margin:0, fontSize:12, opacity:.8 },
  errorText: { color:'#ff7a7a', margin:0 },
}
}
