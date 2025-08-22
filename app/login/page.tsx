'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

      {/* ボタン：ドーム型ガラス */}
      <div style={styles.bottomBlock}>
        <div style={{ ...styles.buttonRow, opacity: phase === 'still' ? 1 : 1 /* <- 常時表示にするなら1 */ }}>
          <DomeButton label="はじめて" />
          <DomeButton label="ログイン" />
        </div>
      </div>
    </div>
  )
}

/* ========= ドーム型ガラスボタン ========= */
function DomeButton({ label }: { label: string }) {
  const [active, setActive] = useState(false)
  return (
    <div
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{
        position:'relative',
        display:'inline-block',
        borderRadius:9999,
        padding:2,
        background:'linear-gradient(90deg, rgba(14,165,233,.95), rgba(236,72,153,.95))',
        boxShadow: '0 0 14px rgba(14,165,233,.22), 0 0 14px rgba(236,72,153,.22)',
        transform: active ? 'translateY(1px) scale(0.99)' : 'translateY(0)',
        transition:'transform .14s ease, box-shadow .18s ease',
      }}
    >
      <button
        type="button"
        style={{
          border:'none',
          outline:'none',
          borderRadius:9999,
          padding:'14px 42px',
          minHeight:46,
          color:'#fff',
          fontSize:16,
          letterSpacing:'.18em',
          cursor:'pointer',
          background:'linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.36))',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          boxShadow: `
            inset 0 1px 1px rgba(255,255,255,.38),    /* 上のハイライト */
            inset 0 -1px 2px rgba(0,0,0,.45)          /* 下の陰影 */
          `,
          position:'relative',
          overflow:'hidden',
        }}
      >
        {/* クリック時の内側パルス */}
        {active && (
          <span
            style={{
              position:'absolute',
              inset:0,
              borderRadius:9999,
              background:'radial-gradient(circle, rgba(255,255,255,.42), rgba(56,189,248,.28) 45%, rgba(236,72,153,.22) 70%, rgba(255,255,255,0) 72%)',
              animation:'pulseGlow 0.32s ease-out forwards',
              pointerEvents:'none'
            } as CSSProperties}
          />
        )}
        {label}
      </button>

      <style jsx>{`
        @keyframes pulseGlow {
          0%   { opacity: .7; transform: scale(0.6); }
          70%  { opacity: .3; transform: scale(1.5); }
          100% { opacity: 0;  transform: scale(2.1); }
        }
      `}</style>
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
