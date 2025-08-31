<<<<<<< HEAD
// app/register/page.tsx
'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser' // ← tsconfig の paths で '@/*' を許可している前提

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setDone(true)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        '登録に失敗しました'
      setError(humanizeAuthError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      {/* 背景（CSSだけ） */}
      <div style={styles.bg} aria-hidden>
        <div style={styles.auraMain} />
        <div style={styles.auraSide} />
        <div style={styles.noise} />
      </div>

      {/* 中央カード */}
      <section style={styles.card} aria-live="polite">
        <h1 style={styles.title}>新規登録</h1>

        {!done ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label htmlFor="email" style={styles.label}>メールアドレス</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <label htmlFor="password" style={styles.label}>パスワード</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ ...styles.input, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
                style={styles.pwToggle}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            <label htmlFor="confirm" style={styles.label}>パスワード（確認）</label>
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="もう一度入力"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              style={styles.input}
            />

            <label style={styles.checkRow as CSSProperties}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>利用規約に同意します</span>
            </label>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? '作成中…' : 'アカウントを作成'}
            </button>

            {error && <p style={styles.errorText}>{error}</p>}

            <p style={styles.small}>
              すでにアカウントをお持ちですか？{' '}
              <a href="/login/form" style={styles.link}>ログイン</a>
            </p>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0 }}>
              登録メールを送信しました。受信箱をご確認ください。
            </p>
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
  },
  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(60% 45% at 50% 65%, #0b1522 0%, #000 72%)',
  },
  auraMain: {
    position: 'absolute',
    left: '50%',
    top: '68%',
    width: 520,
    height: 520,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(79,195,255,.32), rgba(0,0,0,0) 60%)',
    filter: 'blur(22px)',
  },
  auraSide: {
    position: 'absolute',
    left: '70%',
    top: '28%',
    width: 260,
    height: 260,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(255,79,223,.24), rgba(0,0,0,0) 60%)',
    filter: 'blur(18px)',
  },
  noise: {
    position: 'absolute',
    inset: 0,
    opacity: 0.07,
    backgroundImage:
      'radial-gradient(circle at 10% 20%, #fff2 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, #fff1 0.5px, transparent 0.5px)',
    backgroundSize: '120px 120px, 160px 160px',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: 380,
    maxWidth: 'calc(100vw - 28px)',
    padding: '28px 24px 24px',
    display: 'grid',
    gap: 12,
    background: 'rgba(0,0,0,.55)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 18,
    backdropFilter: 'blur(4px)',
    boxShadow: '0 10px 40px rgba(0,0,0,.35)',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '.04em' },
  form: { display: 'grid', gap: 12 },
  label: { fontSize: 12, opacity: 0.8 },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #333',
    background: '#111',
    color: '#fff',
    outline: 'none',
    transition: 'box-shadow .15s ease, border-color .15s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
  },
  pwToggle: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    opacity: 0.9,
  },
  primaryBtn: {
    padding: '12px 14px',
    borderRadius: 9999,
    border: 'none',
    background: '#1e90ff',
    color: '#fff',
    cursor: 'pointer',
  },
  linkBtn: {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
    textDecoration: 'none',
    background: 'transparent',
    width: 'fit-content',
  },
  link: { color: '#9dc9ff', textDecoration: 'underline' },
  small: { margin: 0, fontSize: 12, opacity: 0.8 },
  errorText: { color: '#ff7a7a', margin: 0 },
=======
'use client'
export default function Page() {
  return <div style={{padding:24}}>REGISTER OK</div>
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
}
