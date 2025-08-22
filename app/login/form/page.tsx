'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

type Phase = 'video' | 'still'

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)

  // ===== 背景動画の再生可否だけ見る（失敗なら静止画に即フォールバック）
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setPhase('still'); return }

    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.playsInline = true
    v.play().catch(() => setPhase('still'))
    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    return () => { v.removeEventListener('ended', onEnded); v.removeEventListener('error', onError) }
  }, [])

  return (
    <main style={styles.page}>
      {/* ===== 緊急JUMP（覆い被さり検出用） ===== */}
      <button
        onClick={() => { window.location.assign('/login/form') }}
        style={styles.emergency}
        aria-label="緊急ジャンプ"
        title="緊急ジャンプ"
      >
        ⇢ /login/form
      </button>

      {/* ===== 背景（必ず背面・クリック不可） ===== */}
      <div style={styles.bgWrap} aria-hidden>
        {phase === 'video' ? (
          <video
            ref={videoRef}
            src="/login-intro.mp4"
            autoPlay
            muted
            loop={false}
            playsInline
            preload="auto"
            poster="/login-still.png"
            style={styles.bgMedia}
          />
        ) : (
          <img
            src="/login-still.png"
            alt=""
            aria-hidden
            style={styles.bgMedia}
          />
        )}
      </div>

      {/* ===== 前景カード（リンクは“生のa”で100%飛ばす） ===== */}
      <section style={styles.card}>
        <h1 style={styles.title}>EVΛƎ · Login</h1>
        <p style={styles.subtitle}>あなたの意識の軌跡に、静かな光を。</p>
        <div style={styles.row}>
          <a href="/login/form?mode=signup" style={styles.btnPink}>
            はじめて
            <span aria-hidden style={styles.glass} />
          </a>
          <a href="/login/form" style={styles.btnBlue}>
            ログイン
            <span aria-hidden style={styles.glass} />
          </a>
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
    overflow: 'hidden',
  },
  // ← 背景ラッパーに pointer-events:none + zIndex:-1 を付ける（これが超重要）
  bgWrap: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  bgMedia: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  card: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gap: 16,
    textAlign: 'center',
    padding: '28px 28px 32px',
    borderRadius: 20,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,.1)',
    margin: '0 auto',
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '.08em' },
  subtitle: { margin: '2px 0 8px', opacity: 0.85 },
  row: { display: 'flex', gap: 14, justifyContent: 'center' },

  btnBase: {
    position: 'relative',
    display: 'inline-block',
    borderRadius: 9999,
    padding: '14px 48px',
    fontSize: 16,
    letterSpacing: '.15em',
    color: '#fff',
    textDecoration: 'none',
    background: '#000',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)',
    overflow: 'hidden',
  },
  btnPink: {} as CSSProperties,
  btnBlue: {} as CSSProperties,
  glass: {
    position: 'absolute',
    inset: 0,
    borderRadius: 9999,
    background: 'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
    opacity: 0.3,
    pointerEvents: 'none',
  },

  emergency: {
    position: 'fixed',
    left: 8,
    top: 8,
    zIndex: 9999,
    padding: '8px 10px',
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #444',
    background: '#111',
    color: '#fff',
    opacity: 0.7,
  },
}

// 色影だけ後から乗せる
styles.btnPink = { ...styles.btnBase, boxShadow: styles.btnBase.boxShadow + ', 0 0 10px rgba(255,79,223,.2)' }
styles.btnBlue = { ...styles.btnBase, boxShadow: styles.btnBase.boxShadow + ', 0 0 10px rgba(79,195,255,.2)' }
