'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'

type Phase = 'video' | 'still'

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setPhase('still'); return }

    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.playsInline = true
    v.play().catch(() => setPhase('still'))

    const onEnded = () => setPhase('still')    // 3秒ジャスト：終了で切替
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    // 切替チラつき防止の先読み
    const img = new window.Image()
    img.src = '/login-still.png'

    return () => {
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
    }
  }, [])

  return (
    <div style={styles.root}>
      {/* 背景：動画 or 静止画 */}
      {phase === 'video' ? (
        <video
          ref={videoRef}
          style={styles.bg}
          src="/login-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/login-still.png"
        />
      ) : (
        <NextImage
          src="/login-still.png"
          alt="login still"
          fill
          priority
          style={styles.bg as CSSProperties}
        />
      )}

        {/* スキップ（任意） */}
        {phase === 'video' && (
          <button onClick={() => setPhase('still')} style={styles.skip}>スキップ</button>
        )}
      </div>

  )
}

/* ====== ネオン角丸矩形ボタン（青⇄ピンク、Hover/タップ発光） ====== */
function NeonButton({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const gradient =
    'linear-gradient(90deg, rgba(14,165,233,.95), rgba(236,72,153,.95))'

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const glow = active ? 1 : hovered ? (reduced ? 0.55 : 0.75) : 0.35
  const scale = active ? (reduced ? 0.99 : 0.96) : hovered ? (reduced ? 1.005 : 1.02) : 1

  return (
    <div
      style={{ position: 'relative', transform: `scale(${scale})`, transition: 'transform .18s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
    >
      {/* 外周ネオンぼかし */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: 12,
          filter: `blur(${active ? 26 : hovered ? 22 : 16}px)`,
          opacity: active ? 0.95 : hovered ? 0.8 : 0.7,
          background: gradient,
          transition: 'filter .18s ease, opacity .18s ease',
        }}
      />
      {/* 内側の土台（発光） */}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          borderRadius: 12,
          padding: 2,
          background: gradient,
          boxShadow: `0 0 ${32 + glow * 40}px rgba(236,72,153,${glow}), 0 0 ${32 + glow * 40}px rgba(14,165,233,${glow})`,
          transition: 'box-shadow .18s ease',
        }}
      >
        <button
          type="button"
          onClick={(e) => e.preventDefault()} // ← いまは遷移なし（見た目だけ）
          style={{
            border: 'none',
            outline: 'none',
            cursor: 'default',
            borderRadius: 12,
            background: 'rgba(0,0,0,.85)',
            color: '#fff',
            padding: '14px 36px',
            fontSize: 16,
            letterSpacing: '.15em',
            boxShadow: active ? '0 0 0 2px rgba(255,255,255,.25) inset' : 'none',
            transition: 'box-shadow .18s ease',
          }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}

/* ====== inline styles ====== */
const styles = {
  root: { position: 'relative', minHeight: '100dvh', background: '#000', color: '#fff', overflow: 'hidden' },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  topBlock: { position: 'absolute', top: '9vh', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' } as const,
  logo: { fontSize: 48, fontWeight: 600, letterSpacing: '0.35em' },
  logoSub: { marginTop: 6, fontSize: 12, letterSpacing: '0.35em', color: 'rgba(255,255,255,.7)' },
  title: { marginTop: 28, fontSize: 34, fontWeight: 600, letterSpacing: '.06em' },
  subtitle: { marginTop: 6, fontSize: 14, letterSpacing: '.2em', color: 'rgba(255,255,255,.8)' },
  bottomBlock: { position: 'absolute', left: 0, right: 0, bottom: '8vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  buttonRow: { display: 'flex', gap: 18, transition: 'opacity .45s ease' },
  skip: {
    position: 'absolute', right: 20, bottom: -26, fontSize: 12,
    color: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.4)',
    background: 'transparent', borderRadius: 9999, padding: '6px 10px',
  },
} satisfies Record<string, CSSProperties | { [k: string]: unknown }>
