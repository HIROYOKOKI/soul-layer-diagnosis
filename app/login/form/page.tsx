'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'

/* ========= DomeButton (Link版) ========= */
function DomeButton({
  label,
  variant,
  href,
}: {
  label: string
  variant: 'pink' | 'blue'
  href: string
}) {
  const [pressed, setPressed] = useState(false)
  const glow = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'

  const style: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    border: 'none',
    outline: 'none',
    textDecoration: 'none',
    cursor: 'pointer',
    borderRadius: 9999,
    padding: '14px 48px',
    fontSize: 16,
    letterSpacing: '0.15em',
    color: '#fff',
    background: '#000',
    overflow: 'hidden',
    boxShadow: pressed
      ? `0 0 12px ${glow}, 0 0 24px ${glow}, 0 0 48px ${glow}`
      : 'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)',
    transition: 'box-shadow .12s ease',
  }

  return (
    <Link
      href={href}
      prefetch={false}
      style={style}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {label}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background:
            'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
    </Link>
  )
}

/* ========= Page ========= */
type Phase = 'video' | 'still'

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('still')
      return
    }

    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.playsInline = true
    v.play().catch(() => setPhase('still'))

    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

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

      <div style={styles.bottomBlock}>
        <div style={styles.buttonRow}>
          <DomeButton label="はじめて" variant="pink" href="/login/form?mode=signup" />
          <DomeButton label="ログイン" variant="blue" href="/login/form" />
        </div>
      </div>
    </div>
  )
}

/* ========= Styles ========= */
const styles = {
  root: {
    position: 'relative',
    minHeight: '100dvh',
    background: '#000',
    color: '#fff',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'calc(env(safe-area-inset-bottom,0) + 6vh)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: { display: 'flex', gap: 18 },
} satisfies Record<string, CSSProperties>
