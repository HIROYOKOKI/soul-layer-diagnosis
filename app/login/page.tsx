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

    // 自動再生（失敗したら静止画へ）
    v.muted = true
    v.playsInline = true
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPhase('still'))

    // ちょうど再生が終わったら静止画へ
    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    // 念のため：再生長が不明な端末で切替が来ない時の保険（最大4.5秒で静止画へ）
    const failSafe = window.setTimeout(() => setPhase('still'), 4500)

    return () => {
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      clearTimeout(failSafe)
    }
  }, [])

  // クロスフェード用の不透明度
  const videoOpacity = phase === 'video' && playing ? 1 : 0
  const imageOpacity = phase === 'still' ? 1 : 0
  const buttonsOpacity = phase === 'still' ? 1 : 0

  return (
    <main style={styles.page}>
      {/* 背景スタック（video→still をクロスフェード） */}
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
          // ループしない：終わったら ended で静止画へ
          style={{ ...styles.bgMedia, opacity: videoOpacity }}
        />
      </div>

      {/* 前景コンテンツ */}
      <div style={styles.center}>
        <h1 style={{ margin: 0 }}>LOGIN DEBUG</h1>
        <div style={{ display: 'grid', gap: 18, marginTop: 16, opacity: buttonsOpacity, transition: 'opacity .6s ease .05s' }}>
          <a href="/login/form" style={styles.btn}>/login/form へ</a>
          <a href="/login/form?mode=signup" style={styles.btn}>/login/form?mode=signup へ</a>
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
  // 背景は前景の下(z=0)・クリック不可
  bgStack: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  // 両者を重ね、opacityでクロスフェード
  bgMedia: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity .6s ease',
    opacity: 0,
  },
  center: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
  },
  btn: {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: 12,
    background: '#1e90ff',
    color: '#fff',
    textDecoration: 'none',
  },
}
