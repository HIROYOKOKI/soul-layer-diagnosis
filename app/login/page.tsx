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
        background: active
          ? 'linear-gradient(90deg, rgba(14,165,233,1), rgba(236,72,153,1))'
          : 'rgba(255,255,255,0.08)',
        boxShadow: active
          ? '0 0 25px rgba(14,165,233,.75), 0 0 35px rgba(236,72,153,.75)'
          : '0 4px 14px rgba(0,0,0,.6)',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        transition:'all .22s ease',
      }}
    >
      <button
        type="button"
        style={{
          border:'none',
          outline:'none',
          borderRadius:9999,
          padding:'14px 48px',
          minHeight:48,
          color:'#fff',
          fontSize:16,
          letterSpacing:'.15em',
          background: active
            ? 'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,.6))'
            : 'rgba(0,0,0,.85)',
          backdropFilter:'blur(6px)',
          WebkitBackdropFilter:'blur(6px)',
          cursor:'pointer',
          position:'relative',
          overflow:'hidden',
        }}
      >
        {label}

        {/* クリック時の内側フラッシュ */}
        {active && (
          <span
            style={{
              position:'absolute',
              inset:0,
              borderRadius:9999,
              background:'radial-gradient(circle, rgba(255,255,255,.5), rgba(236,72,153,.45) 40%, rgba(14,165,233,.35) 70%, transparent 80%)',
              animation:'pulseFlash 0.4s ease-out forwards',
              pointerEvents:'none'
            } as CSSProperties}
          />
        )}
      </button>

      <style jsx>{`
        @keyframes pulseFlash {
          0%   { opacity: .9; transform: scale(0.6); }
          60%  { opacity: .5; transform: scale(1.3); }
          100% { opacity: 0;   transform: scale(1.8); }
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
