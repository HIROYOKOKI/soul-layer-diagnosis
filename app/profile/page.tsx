'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

type Blood = 'A'|'B'|'O'|'AB'
type Gender = 'male'|'female'|'other'|'secret'
type Attraction = 'hetero'|'homo'|'bi'|'asexual'|'unspecified'

export default function ProfilePage() {
  // ...（状態とuseEffectはあなたのままでOK）...

  // ここでは UI のみ抜粋。保存ロジックはそのまま使ってください
  return (
    <div style={S.wrap}>
      {/* 背景オーラは維持 */}
      <div style={S.bg} aria-hidden>
        <div style={S.auraMain} />
        <div style={S.auraSide} />
        <div style={S.noise} />
      </div>

      <section style={S.card}>
        <h1 style={S.title}>プロフィール</h1>

        <form onSubmit={handleSubmit} style={S.form}>
          {/* ラベルと入力の縦詰まり改善＋余白 */}
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
      </section>
    </div>
  )
}

/* レイアウト用のスタイル（ヘッダー/フッターに合わせて余白調整） */
const S: Record<string, CSSProperties> = {
  wrap: {
    position:'relative',
    minHeight:'calc(100dvh - 0px)', // mainで高さ確保済み
    display:'grid',
    placeItems:'start center',
    padding: '16px 12px 28px',      // 上:ヘッダーの影を避ける / 下:フッター分
  },
  bg: {
    position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
    background:'radial-gradient(60% 45% at 50% 65%, #0b1522 0%, #000 72%)',
  },
  auraMain: { position:'absolute', left:'50%', top:'65%', width:520, height:520,
    transform:'translate(-50%, -50%)', borderRadius:'50%',
    background:'radial-gradient(circle, rgba(79,195,255,.28), rgba(0,0,0,0) 60%)', filter:'blur(22px)' },
  auraSide: { position:'absolute', left:'70%', top:'28%', width:260, height:260,
    borderRadius:'50%', background:'radial-gradient(circle, rgba(255,79,223,.22), rgba(0,0,0,0) 60%)',
    filter:'blur(18px)' },
  noise: { position:'absolute', inset:0, opacity:0.07,
    backgroundImage:'radial-gradient(circle at 10% 20%, #fff2 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, #fff1 0.5px, transparent 0.5px)',
    backgroundSize:'120px 120px, 160px 160px' },

  card: {
    position:'relative', zIndex:1,
    width:'min(520px, 94vw)',      // スマホで横はみ出し防止
    marginTop: 8,
    padding:'20px 16px 18px',
    display:'grid', gap:12,
    background:'rgba(0,0,0,.55)',
    border:'1px solid rgba(255,255,255,.10)',
    borderRadius:16,
    boxShadow:'0 10px 40px rgba(0,0,0,.35)',
    backdropFilter:'blur(4px)',
  },
  title: { margin:'0 0 8px', fontSize:22, fontWeight:700, letterSpacing:'.04em' },
  form: { display:'grid', gap:10 },
  label: { fontSize:13, opacity:.85 },
  input: {
    width:'100%',
    padding:'12px 14px',
    borderRadius:10, border:'1px solid #333',
    background:'#111', color:'#fff', outline:'none',
    transition:'box-shadow .15s ease, border-color .15s ease',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,.06)',
  },
  primaryBtn: {
    marginTop: 6,
    padding:'12px 14px',
    borderRadius:9999, border:'none',
    background:'#1e90ff', color:'#fff',
    cursor:'pointer',
  },
  link: { color:'#9dc9ff', textDecoration:'underline' },
  small: { margin:0, fontSize:12, opacity:.8 },
  error: { color:'#ff7a7a', margin:0 },
};
