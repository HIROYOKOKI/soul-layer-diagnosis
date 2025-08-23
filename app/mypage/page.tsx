'use client'

import { useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

async function testInsertDaily() {
  const supabase = await getBrowserSupabase()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    console.error('not signed in', userErr)
    return
  }

  const { error } = await supabase.from('daily_results').insert({
    user_id: user.id,                          // uuid
    theme: 'work',                             // 'work' | 'love' | 'future' | 'self'
    choice: 'E',
    structure_score: { E: 1, V: 0, Λ: 0, Ǝ: 0 },
    comment: 'RLS test',
    advice: '静かに前進',
  })
  console.log('insert error:', error)          // ← ここが null なら成功
}

export default function MyPage() {
  useEffect(() => {
    void testInsertDaily()
  }, [])

  return (
    <main style={{ padding: 20 }}>
      <h1>マイページ（テスト中）</h1>
      <p>コンソールに <code>insert error: null</code> が出ればOKです。</p>
    </main>
  )
}


/* ===== styles ===== */
const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    background: '#000',
    color: '#fff',
  },
  // 背景
  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(60% 45% at 50% 65%, #0b1522 0%, #000 70%)',
  },
  auraMain: {
    position: 'absolute',
    left: '50%',
    top: '70%',
    width: 560,
    height: 560,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,195,255,.26), rgba(0,0,0,0) 60%)',
    filter: 'blur(22px)',
  },
  noise: {
    position: 'absolute',
    inset: 0,
    opacity: 0.07,
    backgroundImage:
      'radial-gradient(circle at 10% 20%, #fff2 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, #fff1 0.5px, transparent 0.5px)',
    backgroundSize: '120px 120px, 160px 160px',
  },

  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1000,
    margin: '0 auto',
    padding: '24px 16px 40px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  h1: { margin: 0, fontSize: 22, letterSpacing: '.04em' },
  sub: { margin: 0, opacity: 0.75 },

  signoutBtn: {
    padding: '10px 12px',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.2)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
  },

  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  quickCard: {
    position: 'relative',
    display: 'block',
    padding: '16px 16px 18px',
    borderRadius: 16,
    textDecoration: 'none',
    color: '#fff',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.08)',
    backdropFilter: 'blur(2px)',
    boxShadow: '0 10px 30px rgba(0,0,0,.35)',
  },
  quickBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 12,
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.2)',
    marginBottom: 6,
    opacity: 0.85,
  },
  quickTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  quickDesc: { margin: '4px 0 0', opacity: 0.75 },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  panel: {
    padding: 16,
    borderRadius: 16,
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.08)',
    backdropFilter: 'blur(2px)',
    boxShadow: '0 10px 30px rgba(0,0,0,.35)',
  },
  h2: { margin: '0 0 8px', fontSize: 16, opacity: 0.9 },

  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px dashed rgba(255,255,255,.12)',
  },
  listMeta: { opacity: 0.7 },

  progressWrap: { display: 'grid', gap: 8 },
  progressBar: {
    height: 8,
    borderRadius: 9999,
    background: 'rgba(255,255,255,.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4fc3ff, #7ea8ff)',
  },

  smallBtn: {
    display: 'inline-block',
    padding: '8px 10px',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.18)',
    color: '#fff',
    textDecoration: 'none',
    background: 'transparent',
    fontSize: 13,
  },

  center: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
  },
  linkBtn: {
    display: 'inline-block',
    marginTop: 10,
    padding: '8px 12px',
    borderRadius: 9999,
    border: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
    textDecoration: 'none',
  },

  small: { margin: 0, fontSize: 12, opacity: 0.75 },
  spinner: {
    width: 26, height: 26, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,.15)',
    borderTopColor: 'rgba(255,255,255,.75)',
    animation: 'spin .9s linear infinite',
  },
}

// スピナー用の keyframes を追加（CSS-in-JSの簡易法）
if (typeof document !== 'undefined') {
  const id = 'mypage-spin-style'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.innerHTML = '@keyframes spin { to { transform: rotate(360deg) } }'
    document.head.appendChild(style)
  }
}
