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

      {/* ボタン群 */}
      <div style={styles.bottomBlock}>
        <div style={{ ...styles.buttonRow, opacity: phase === 'still' ? 1 : 0 }}>
          <NeonButton label="はじめて" />
          <NeonButton label="ログイン" />
        </div>
      </div>
    </div>
  )
}

/* ====== ネオンボタン ====== */
function DomeButton({ label }: { label: string }) {
  const [active, setActive] = useState(false)

  return (
    <button
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      style={{
        position:'relative',
        border:'none',
        outline:'none',
        cursor:'pointer',
        borderRadius:9999, // pill shape
        padding:'14px 42px',
        fontSize:16,
        letterSpacing:'.15em',
        color:'#fff',
        background:'linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.35))',
        backdropFilter:'blur(8px)',
        WebkitBackdropFilter:'blur(8px)',
        boxShadow: `
          inset 0 1px 1px rgba(255,255,255,.35),  /* top highlight */
          inset 0 -1px 2px rgba(0,0,0,.4),       /* bottom shadow */
          0 0 12px rgba(56,189,248,.4),          /* blue glow */
          0 0 18px rgba(236,72,153,.35)          /* pink glow */
        `,
        transform: active ? 'translateY(1px) scale(0.98)' : 'translateY(0)',
        transition:'all .18s ease',
      }}
    >
      {label}
      {/* クリック時の発光エフェクト */}
      {active && (
        <span
          style={{
            position:'absolute',
            inset:0,
            borderRadius:9999,
            background:'radial-gradient(circle, rgba(255,255,255,.35), transparent 70%)',
            animation:'pulse 0.35s ease-out forwards',
            pointerEvents:'none'
          }}
        />
      )}
      <style jsx>{`
        @keyframes pulse {
          0%   { opacity: .6; transform: scale(0.6); }
          70%  { opacity: .25; transform: scale(1.4); }
          100% { opacity: 0;   transform: scale(1.9); }
        }
      `}</style>
    </button>
  )
}


const styles = {
  root: { position:'relative', minHeight:'100dvh', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' },
  bottomBlock: { position:'absolute', left:0, right:0, bottom:'8vh', display:'flex', justifyContent:'center', alignItems:'center' },
  buttonRow: { display:'flex', gap:18, transition:'opacity .45s ease' },
} satisfies Record<string, CSSProperties>
