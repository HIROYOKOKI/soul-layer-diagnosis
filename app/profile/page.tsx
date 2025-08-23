// app/profile/page.tsx
'use client'

import { useEffect, useState, type FormEvent, type CSSProperties } from 'react'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [blood, setBlood] = useState<'A' | 'B' | 'O' | 'AB'>('A')
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Secret'>('Other')
  const [preference, setPreference] = useState<'Unset' | 'Hetero' | 'Homo' | 'Bi' | 'Asexual'>('Unset')

  // このページだけ横スクロール禁止 & ヘッダー/フッターを隠す
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflowX
    const prevBody = body.style.overflowX
    html.style.overflowX = 'hidden'
    body.style.overflowX = 'hidden'
    return () => {
      html.style.overflowX = prevHtml
      body.style.overflowX = prevBody
    }
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert('保存しました！')
  }

  return (
    <div style={S.wrap}>
      {/* このページだけヘッダー/フッターを消す */}
      <style jsx global>{`header, footer { display: none !important; }`}</style>

      <div style={S.card}>
        <h1 style={S.title}>PROFILE</h1>

        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label} htmlFor="name">ニックネーム</label>
          <input
            id="name"
            style={S.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="山田 太郎"
            inputMode="text"
            autoComplete="name"
          />

          <label style={S.label} htmlFor="dob">生年月日</label>
          <input
            id="dob"
            style={S.input}
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            autoComplete="bday"
          />

          <label style={S.label} htmlFor="blood">血液型</label>
          <select
            id="blood"
            style={S.input}
            value={blood}
            onChange={(e) => setBlood(e.target.value as typeof blood)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="O">O</option>
            <option value="AB">AB</option>
          </select>

          <label style={S.label} htmlFor="gender">性別</label>
          <select
            id="gender"
            style={S.input}
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Secret">Secret</option>
          </select>

          <label style={S.label} htmlFor="pref">恋愛対象</label>
          <select
            id="pref"
            style={S.input}
            value={preference}
            onChange={(e) => setPreference(e.target.value as typeof preference)}
          >
            <option value="Unset">Unset</option>
            <option value="Hetero">Hetero</option>
            <option value="Homo">Homo</option>
            <option value="Bi">Bi</option>
            <option value="Asexual">Asexual</option>
          </select>

          <button type="submit" style={S.button}>SAVE</button>
        </form>
      </div>
    </div>
  )
}

const glow = '0 0 12px rgba(0,180,255,.8), 0 0 24px rgba(150,0,255,.55)'

const S: Record<string, CSSProperties> = {
  wrap: {
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '100vw',        // はみ出し防止
    overflowX: 'hidden',      // 念のため
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(1200px 800px at 50% -10%, #0b1220, #000 70%)',
    color: '#fff',
    fontFamily: 'ui-sans-serif, SF Pro Text, Helvetica, Arial',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'manipulation',
  },
  card: {
    width: 'min(440px, 92vw)',
    padding: '32px 24px',
    borderRadius: 20,
    background: 'rgba(10,12,20,.65)',
    border: '1px solid rgba(80,150,255,.25)',
    boxShadow: glow,
    backdropFilter: 'blur(8px)',
  },
  title: {
    margin: '0 0 28px',
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: '.12em',
    fontWeight: 700,
    color: '#6bf',
    textShadow: glow,
  },
  form: { display: 'grid', gap: 16 },
  label: {
    fontSize: 12,
    letterSpacing: '.1em',
    marginBottom: 4,
    color: '#6bf',
  },
  input: {
    minHeight: 44,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(120,160,255,.3)',
    background: 'rgba(0,0,0,.6)',
    color: '#fff',
    outline: 'none',
    transition: 'box-shadow .2s ease, border-color .2s ease, background .2s ease',
    boxShadow: 'inset 0 0 0 0 rgba(0,0,0,0)',
  },
  button: {
    marginTop: 8,
    height: 48,
    padding: '0 20px',
    borderRadius: 9999,
    border: '1px solid rgba(80,150,255,.4)',
    background: 'linear-gradient(90deg,#0af,#a0f)',
    color: '#fff',
    fontWeight: 700,
    letterSpacing: '.08em',
    cursor: 'pointer',
    boxShadow: glow,
  },
}
