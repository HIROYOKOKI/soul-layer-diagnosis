'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

type Phase = 'video' | 'still' | 'error'

export default function LoginDebug() {
  const [phase, setPhase] = useState<Phase>('video')
  const [msg, setMsg] = useState<string>('loading...')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onCanPlay = () => { setMsg('canplay'); /* 再生に進む */ }
    const onLoadedData = () => setMsg('loadeddata')
    const onPlay = () => setMsg('playing')
    const onEnded = () => { setMsg('ended -> still'); setPhase('still') }
    const onError = () => { setMsg('video error'); setPhase('error') }

    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('loadeddata', onLoadedData)
    v.addEventListener('play', onPlay)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    // 自動再生（muted+playsInlineでSafariもOKのはず）
    v.muted = true
    v.playsInline = true
    v.play().catch((e) => { setMsg('autoplay rejected'); setPhase('still') })

    return () => {
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('loadeddata', onLoadedData)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
    }
  }, [])

  return (
    <main style={page}>
      {/* 背景：必ず背面、クリック無効 */}
      <div style={bgWrap} aria-hidden>
        {phase === 'video' ? (
          <video
            ref={videoRef}
            src="/login-intro.mp4"
            poster="/login-still.png"
            autoPlay
            muted
            playsInline
            preload="auto"
            style={bgMedia}
          />
        ) : (
          <img src="/login-still.png" alt="" aria-hidden style={bgMedia} />
        )}
      </div>

      {/* 前景：遷移確認リンク */}
      <div style={center}>
        <h1 style={{ margin: 0 }}>LOGIN DEBUG</h1>
        <a href="/login/form" style={btn}>/login/form へ</a>
        <a href="/login/form?mode=signup" style={btn}>/login/form?mode=signup へ</a>
      </div>

      {/* デバッグ表示（右上） */}
      <div style={badge}>
        phase: {phase} — {msg}{' '}
        <a href="/login-intro.mp4" target="_blank" rel="noreferrer" style={link}>open mp4</a>{' / '}
        <a href="/login-still.png" target="_blank" rel="noreferrer" style={link}>open png</a>
      </div>
    </main>
  )
}

/* ===== styles ===== */
const page: CSSProperties = {
  minHeight: '100dvh',
  background: '#000',
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
}

const bgWrap: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
}

const bgMedia: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const center: CSSProperties = {
  display: 'grid',
  gap: 12,
  textAlign: 'center',
  placeItems: 'center',
  minHeight: '100dvh',
  position: 'relative',
  zIndex: 10,
}

const btn: CSSProperties = {
  display: 'inline-block',
  padding: '12px 18px',
  borderRadius: 12,
  background: '#1e90ff',
  color: '#fff',
  textDecoration: 'none',
}

const badge: CSSProperties = {
  position: 'fixed',
  right: 8,
  top: 8,
  zIndex: 20,
  background: 'rgba(0,0,0,.6)',
  border: '1px solid #333',
  padding: '6px 8px',
  borderRadius: 8,
  fontSize: 12,
}

const link: CSSProperties = { color: '#9dc9ff', textDecoration: 'underline' }
