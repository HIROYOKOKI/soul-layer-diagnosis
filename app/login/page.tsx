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
function NeonButton({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const gradient = 'linear-gradient(90deg, rgba(14,165,233,.95), rgba(236,72,153,.95))'
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const glow = active ? 1 : hovered ? (reduced ? 0.55 : 0.75) : 0.35
  const scale = active ? (reduced ? 0.99 : 0.96) : hovered ? (reduced ? 1.005 : 1.02) : 1

  return (
    <div
      style={{ position:'relative', transform:`scale(${scale})`, transition:'transform .18s ease' }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      onFocus={()=>setHovered(true)}
      onBlur={()=>setHovered(false)}
      onMouseDown={()=>setActive(true)}
      onMouseUp={()=>setActive(false)}
      onTouchStart={()=>setActive(true)}
      onTouchEnd={()=>setActive(false)}
    >
      <div
        aria-hidden
        style={{
          position:'absolute',
          inset:-6,
          borderRadius:12,
          filter:`blur(${active ? 26 : hovered ? 22 : 16}px)`,
          opacity: active ? 0.95 : hovered ? 0.8 : 0.7,
          background:gradient,
          transition:'filter .18s ease, opacity .18s ease'
        }}
      />
      <div
        style={{
          position:'relative',
          display:'inline-flex',
          borderRadius:12,
          padding:2,
          background:gradient,
          boxShadow:`0 0 ${32 + glow*40}px rgba(236,72,153,${glow}), 0 0 ${32 + glow*40}px rgba(14,165,233,${glow})`,
          transition:'box-shadow .18s ease'
        }}
      >
        <button
          type="button"
          onClick={(e)=>e.preventDefault()}
          style={{
            border:'none', outline:'none', cursor:'default',
            borderRadius:12,
            background:'rgba(0,0,0,.85)',
            color:'#fff',
            padding:'14px 36px',
            fontSize:16, letterSpacing:'.15em',
            boxShadow: active ? '0 0 0 2px rgba(255,255,255,.25) inset' : 'none',
            transition:'box-shadow .18s ease'
          }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}

const styles = {
  root: { position:'relative', minHeight:'100dvh', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' },
  bottomBlock: { position:'absolute', left:0, right:0, bottom:'8vh', display:'flex', justifyContent:'center', alignItems:'center' },
  buttonRow: { display:'flex', gap:18, transition:'opacity .45s ease' },
} satisfies Record<string, CSSProperties>
