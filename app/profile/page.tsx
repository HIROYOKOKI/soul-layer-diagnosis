'use client'

import { useState, type FormEvent } from 'react'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [blood, setBlood] = useState('A')
  const [gender, setGender] = useState('Other')
  const [preference, setPreference] = useState('Unset')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    alert('保存しました！')
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>PROFILE</h1>

        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label}>NAME</label>
          <input style={S.input} value={name} onChange={(e)=>setName(e.target.value)} />

          <label style={S.label}>DATE OF BIRTH</label>
          <input style={S.input} type="date" value={birthday} onChange={(e)=>setBirthday(e.target.value)} />

          <label style={S.label}>BLOOD TYPE</label>
          <select style={S.input} value={blood} onChange={(e)=>setBlood(e.target.value)}>
            <option>A</option><option>B</option><option>O</option><option>AB</option>
          </select>

          <label style={S.label}>GENDER</label>
          <select style={S.input} value={gender} onChange={(e)=>setGender(e.target.value)}>
            <option>Male</option><option>Female</option><option>Other</option><option>Secret</option>
          </select>

          <label style={S.label}>PREFERENCE</label>
          <select style={S.input} value={preference} onChange={(e)=>setPreference(e.target.value)}>
            <option>Unset</option><option>Hetero</option><option>Homo</option><option>Bi</option><option>Asexual</option>
          </select>

          <button type="submit" style={S.button}>SAVE</button>
        </form>
      </div>
    </div>
  )
}

const glow = '0 0 12px rgba(0,180,255,.8), 0 0 24px rgba(150,0,255,.6)'

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at top, #05060a, #000 80%)',
    color: '#fff',
    fontFamily: 'ui-sans-serif, SF Pro Text, Helvetica, Arial',
  },
  card: {
    width: 'min(420px, 92vw)',
    padding: '32px 24px',
    borderRadius: 20,
    background: 'rgba(10,12,20,.65)',
    border: '1px solid rgba(80,150,255,.25)',
    boxShadow: glow,
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
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(120,160,255,.3)',
    background: 'rgba(0,0,0,.6)',
    color: '#fff',
    outline: 'none',
    transition: 'all .2s ease',
  },
  button: {
    marginTop: 12,
    padding: '14px 20px',
    borderRadius: 9999,
    border: '1px solid rgba(80,150,255,.4)',
    background: 'linear-gradient(90deg,#0af,#a0f)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: glow,
  },
}
