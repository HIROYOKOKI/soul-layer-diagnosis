'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

type Phase = 'video' | 'still'

export default function LoginDebug() {
  const [phase, setPhase] = useState<Phase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.muted = true
    v.playsInline = true

    // 自動再生（失敗したら静止画）
    v.play().catch(() => setPhase('still'))

    // ここでは ended に切り替えず、常に動画を見せたいなら何もしない
    // v.addEventListener('ended', () => setPhase('still')) // ← 不要。ループで回すため。
  }, [])

  return (
    <main style={page}>
      {/* 背景（背面・クリック無効） */}
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
            loop                     // ← ループで切り替えを防ぐ
            style={bgMedia}          // ← 画面全面に絶対配置
          />
        ) : (
          <img src="/login-still.png" alt="" aria-hidden style={bgMedia} />
        )}
      </div>

      {/* 前景リンク（動作確認用） */}
      <div style={center}>
        <h1 style={{ margin: 0 }}>LOGIN DEBUG</h1>
        <a href="/login/form" style={btn}>/login/form へ</a>
        <a href="/login/form?mode=signup" style={btn}>/login/form?mode=signup へ</a>
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
  position: 'absolute',  // ← これが効く
  inset: 0,
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
