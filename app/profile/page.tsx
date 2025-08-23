'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

type Blood = 'A'|'B'|'O'|'AB'
type Gender = 'male'|'female'|'other'|'secret'
type Attraction = 'hetero'|'homo'|'bi'|'asexual'|'unspecified'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('') // yyyy-mm-dd
  const [blood, setBlood] = useState<Blood>('A')
  const [gender, setGender] = useState<Gender>('other')
  const [attraction, setAttraction] = useState<Attraction>('unspecified')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [ok, setOk] = useState(false)

  // 既存プロフィールがあれば読んで初期値に反映
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getBrowserSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data) {
          setName(data.name ?? '')
          setBirthday(data.birthday ?? '')
          setBlood((data.blood_type as Blood) ?? 'A')
          setGender((data.gender as Gender) ?? 'other')
          setAttraction((data.attraction as Attraction) ?? 'unspecified')
        }
      } catch {}
    })()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('名前を入力してください')
    if (!birthday) return setError('生年月日を入力してください')

    setLoading(true)
    try {
      const supabase = await getBrowserSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const payload = {
        user_id: user.id,
        name: name.trim(),
        birthday,
        blood_type: blood,
        gender,
        attraction,
        updated_at: new Date().toISOString(),
      }

      // upsert（既存なら更新）
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error

      setOk(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={S.page}>
      <div style={S.bg} aria-hidden>
        <div style={S.auraMain} />
        <div style={S.auraSide} />
        <div style={S.noise} />
      </div>

      <section style={S.card} aria-live="polite">
        <h1 style={S.title}>プロフィール</h1>

        {!ok ? (
          <form onSubmit={handleSubmit} style={S.form}>
            <label style={S.label} htmlFor="name">名前</label>
            <input id="name" style={S.input} value={name}
              onChange={(e)=>setName(e.target.value)} placeholder="山田 太郎" required />

            <label style={S.label} htmlFor="birthday">生年月日</label>
            <input id="birthday" style={S.input} type="date" value={birthday}
              onChange={(e)=>setBirthday(e.target.value)} required />

            <label style={S.label}>血液型</label>
            <select style={S.input} value={blood} onChange={(e)=>setBlood(e.target.value as Blood)}>
              <option value="A">A</option><option value="B">B</option>
              <option value="O">O</option><option value="AB">AB</option>
            </select>

            <label style={S.label}>性別</label>
            <select style={S.input} value={gender} onChange={(e)=>setGender(e.target.value as Gender)}>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
              <option value="secret">非公開</option>
            </select>

            <label style={S.label}>恋愛対象</label>
            <select style={S.input} value={attraction} onChange={(e)=>setAttraction(e.target.value as Attraction)}>
              <option value="hetero">異性</option>
              <option value="homo">同性</option>
              <option value="bi">両方</option>
              <option value="asexual">無指向</option>
              <option value="unspecified">未設定</option>
            </select>

            <button type="submit" disabled={loading} style={S.primaryBtn}>
              {loading ? '保存中…' : '保存する'}
            </button>

            {error && <p style={S.error}>{error}</p>}
            <p style={S.small}>
              戻る：<a href="/mypage" style={S.link}>マイページ</a>
            </p>
          </form>
        ) : (
          <div style={{display:'grid',gap:12}}>
            <p style={{margin:0}}>保存しました。</p>
            <a href="/structure" style={S.linkBtn}>次へ：構造診断へ進む</a>
          </div>
        )}
      </section>
    </main>
  )
}

const S: Record<string, CSSProperties> = {
  page: { position:'relative', minHeight:'100dvh', display:'grid', placeItems:'center', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'radial-gradient(60% 45% at 50% 65%, #0b1522 0%, #000 72%)' },
  auraMain: { position:'absolute', left:'50%', top:'68%', width:520, height:520, transform:'translate(-50%, -50%)', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,195,255,.32), rgba(0,0,0,0) 60%)', filter:'blur(22px)' },
  auraSide: { position:'absolute', left:'70%', top:'28%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,79,223,.24), rgba(0,0,0,0) 60%)', filter:'blur(18px)' },
  noise: { position:'absolute', inset:0, opacity:0.07, backgroundImage:'radial-gradient(circle at 10% 20%, #fff2 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, #fff1 0.5px, transparent 0.5px)', backgroundSize:'120px 120px, 160px 160px' },
  card: { position:'relative', zIndex:1, width:420, maxWidth:'calc(100vw - 28px)', padding:'28px 24px 24px', display:'grid', gap:12, background:'rgba(0,0,0,.55)', border:'1px solid rgba(255,255,255,.1)', borderRadius:18, backdropFilter:'blur(4px)', boxShadow:'0 10px 40px rgba(0,0,0,.35)' },
  title: { margin:0, fontSize:22, fontWeight:700, letterSpacing:'.04em' },
  form: { display:'grid', gap:12 },
  label: { fontSize:12, opacity:.8 },
  input: { padding:'12px 14px', borderRadius:10, border:'1px solid #333', background:'#111', color:'#fff', outline:'none', transition:'box-shadow .15s ease, borderColor .15s ease', boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)' },
  primaryBtn: { padding:'12px 14px', borderRadius:9999, border:'none', background:'#1e90ff', color:'#fff', cursor:'pointer' },
  linkBtn: { display:'inline-block', padding:'10px 14px', borderRadius:9999, border:'1px solid rgba(255,255,255,.2)', color:'#fff', textDecoration:'none', background:'transparent', width:'fit-content' },
  link: { color:'#9dc9ff', textDecoration:'underline' },
  small: { margin:0, fontSize:12, opacity:.8 },
  error: { color:'#ff7a7a', margin:0 },
}
