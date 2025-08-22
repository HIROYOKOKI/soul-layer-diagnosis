'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

type Phase = 'video' | 'still'

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video')
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.muted = true
    v.playsInline = true
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPhase('still'))

    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    const failSafe = window.setTimeout(() => setPhase('still'), 4500)

    return () => {
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      clearTimeout(failSafe)
    }
  }, [])

  const videoOpacity = phase === 'video' && playing ? 1 : 0
  const imageOpacity = phase === 'still' ? 1 : 0
  const buttonsOpacity = phase === 'still' ? 1 : 0

  return (
    <main style={styles.page}>
      {/* 背景：video→still クロスフェード */}
      <div style={styles.bgStack} aria-hidden>
        <img
          src="/login-still.png"
          alt=""
          aria-hidden
          style={{ ...styles.bgMedia, opacity: imageOpacity }}
        />
        <video
          ref={videoRef}
          src="/login-intro.mp4"
          poster="/login-still.png"
          autoPlay
          muted
          playsInline
          preload="auto"
          style={{ ...styles.bgMedia, opacity: videoOpacity }}
        />
      </div>

      {/* ボタン：下部に横並びでフェードイン */}
      <div style={styles.bottomBlock}>
        <div style={{ ...styles.buttonRow, opacity: buttonsOpacity }}>
          <a href="/login/form?mode=signup" style={styles.btnPink}>
            はじめて<span aria-hidden style={styles.glass}/>
          </a>
          <a href="/login/form" style={styles.btnBlue}>
            ログイン<span aria-hidden style={styles.glass}/>
          </a>
        </div>
      </div>
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
    transition: 'opacity .6s ease',
    opacity: 0,
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'calc(env(safe-area-inset-bottom,0) + 6vh)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    transition: 'opacity .6s ease',
  },
  buttonRow: {
    display: 'flex',
    gap: 18,
    transition: 'opacity .6s ease',
  },
  btnBase: {
    position: 'relative',
    display: 'inline-block',
    textDecoration: 'none',
    borderRadius: 9999,
    padding: '14px 48px',
    color: '#fff',
    background: '#000',
    boxShadow:
      'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)',
    overflow: 'hidden',
  },
  btnPink: {} as CSSProperties,
  btnBlue: {} as CSSProperties,
  glass: {
    position: 'absolute',
    inset: 0,
    borderRadius: 9999,
    background:
      'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
    opacity: 0.3,
    pointerEvents: 'none',
  },
}

styles.btnPink = {
  ...styles.btnBase,
  boxShadow: styles.btnBase.boxShadow + ', 0 0 10px rgba(255,79,223,.2)',
}
styles.btnBlue = {
  ...styles.btnBase,
  boxShadow: styles.btnBase.boxShadow + ', 0 0 10px rgba(79,195,255,.2)',
}
