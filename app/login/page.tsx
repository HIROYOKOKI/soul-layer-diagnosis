'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'

/* ========= ドーム型ガラスボタン ========= */
function DomeButton({ label, variant }: { label: string; variant: 'pink' | 'blue' }) {
  const [pressed, setPressed] = useState(false)
  const lift = pressed ? 0 : 2

  // 発光カラーを variant で切り替え
  const glowColor = variant === 'pink' ? 'rgba(236,72,153,.55)' : 'rgba(14,165,233,.55)'

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: 9999,
        transform: pressed ? 'translateY(1px) scale(0.995)' : `translateY(-${lift}px)`,
        transition: 'transform .16s ease, box-shadow .18s ease, background .2s ease',
      }}
    >
      <button
        type="button"
        style={{
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          borderRadius: 9999,
          padding: '14px 48px',
          minHeight: 48,
          color: '#fff',
          letterSpacing: '.18em',
          fontSize: 16,
          // CMYK指定色に近い黒ベース
          background: '#0a0a0a',
          boxShadow: pressed
            ? `0 0 12px ${glowColor}`
            : `0 0 24px ${glowColor}, 0 0 48px ${glowColor}55`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 発光エフェクト */}
        {pressed && (
          <span
            aria-hidden
            style={{
              position: 'absolute', inset: 0, borderRadius: 9999,
              background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              animation: 'domeFlash .35s ease-out forwards',
            }}
          />
        )}
        {label}
        <style jsx>{`
          @keyframes domeFlash {
            0%   { opacity: .9; transform: scale(0.85); }
            70%  { opacity: .4; transform: scale(1.15); }
            100% { opacity: 0;  transform: scale(1.35); }
          }
        `}</style>
      </button>
    </div>
  )
}
/* ========= ページ本体 ========= */
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

    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    const img = new window.Image()
    img.src = '/login-still.png'

    return () => {
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
    }
  }, [])

  return (
    <div style={styles.root}>
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

     <div style={{ ...styles.buttonRow, opacity: phase === 'still' ? 1 : 0 }}>
  <DomeButton label="はじめて" variant="pink" />
  <DomeButton label="ログイン" variant="blue" />
</div>
      </div>
    </div>
  )
}

/* ========= styles ========= */
const styles = {
  root: { position:'relative', minHeight:'100dvh', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' },
  bottomBlock: { position:'absolute', left:0, right:0, bottom:'calc(env(safe-area-inset-bottom,0) + 6vh)', display:'flex', justifyContent:'center', alignItems:'center' },
  buttonRow: { display:'flex', gap:18, transition:'opacity .35s ease' },
} satisfies Record<string, CSSProperties>
