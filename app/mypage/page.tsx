'use client'

import { useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

async function testInsertDaily() {
  const supabase = await getBrowserSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return console.error('not signed in')

  const { error } = await supabase.from('daily_results').insert({
    user_id: user.id,
    theme: 'work',
    choice: 'E',
    structure_score: { E: 1, V: 0, Λ: 0, Ǝ: 0 },
    comment: 'RLS test',
    advice: '静かに前進',
  })
  console.log('insert error:', error)
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserLite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 認証チェック（未ログインは /login/form へ）
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getBrowserSupabase()
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!data.user) {
          router.replace('/login/form')
          return
        }
        setUser({ email: data.user.email })
      } catch (e) {
        setError('認証状態の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const handleSignOut = async () => {
    try {
      const supabase = await getBrowserSupabase()
      await supabase.auth.signOut()
      router.replace('/login')
    } catch {
      // 表示は控えめに
      alert('サインアウトに失敗しました。時間をおいて再試行してください。')
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={{ opacity: .7, marginTop: 12 }}>読み込み中…</p>
        </div>
      </main>
    )
  }
  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.center}>
          <p style={{ color: '#ff7a7a', margin: 0 }}>{error}</p>
          <a href="/login/form" style={styles.linkBtn}>ログインへ戻る</a>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      {/* 背景（CSSのみ） */}
      <div style={styles.bg} aria-hidden>
        <div style={styles.auraMain} />
        <div style={styles.noise} />
      </div>

      <section style={styles.container}>
        {/* ヘッダー */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>マイページ</h1>
            <p style={styles.sub}>{user?.email ?? 'ゲスト'} さん、ようこそ</p>
          </div>
          <button onClick={handleSignOut} style={styles.signoutBtn}>サインアウト</button>
        </header>

        {/* クイックアクション */}
        <div style={styles.quickGrid}>
          <a href="/daily" style={styles.quickCard}>
            <div style={styles.quickBadge}>今日</div>
            <h3 style={styles.quickTitle}>Daily 診断</h3>
            <p style={styles.quickDesc}>今日の1問・気軽に観測</p>
          </a>

          <a href="/weekly" style={styles.quickCard}>
            <div style={styles.quickBadge}>週次</div>
            <h3 style={styles.quickTitle}>Weekly 診断</h3>
            <p style={styles.quickDesc}>6問で今週の傾向を把握</p>
          </a>

          <a href="/monthly" style={styles.quickCard}>
            <div style={styles.quickBadge}>月次</div>
            <h3 style={styles.quickTitle}>Monthly 診断</h3>
            <p style={styles.quickDesc}>12問で深く観測する</p>
          </a>
        </div>

        {/* 2カラム：最近の診断 / プロフィール進捗 */}
        <div style={styles.twoCol}>
          <section style={styles.panel}>
            <h2 style={styles.h2}>最近の診断</h2>
            {/* ← 実データ接続前のダミー */}
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span>Daily</span>
                <span style={styles.listMeta}>2025-08-23</span>
              </li>
              <li style={styles.listItem}>
                <span>Weekly</span>
                <span style={styles.listMeta}>2025-08-19</span>
              </li>
              <li style={styles.listItem}>
                <span>Monthly</span>
                <span style={styles.listMeta}>2025-08-01</span>
              </li>
            </ul>
            <a href="/log" style={styles.linkBtn}>履歴をすべて見る</a>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.h2}>プロフィール進捗</h2>
            <div style={styles.progressWrap}>
              <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: '60%' }} /></div>
              <p style={styles.small}>60% 完了（基本情報 + 構造診断）</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="/profile" style={styles.smallBtn}>基本プロフィール</a>
              <a href="/structure" style={styles.smallBtn}>構造診断</a>
              <a href="/theme" style={styles.smallBtn}>テーマ設定</a>
            </div>
          </section>
        </div>
      </section>
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
