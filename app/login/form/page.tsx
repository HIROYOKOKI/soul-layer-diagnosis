'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'

/* ===== 極力シンプルな Link ボタン（イベントなし） ===== */
function DomeButton({
  label,
  variant,
  href,
}: {
  label: string
  variant: 'pink' | 'blue'
  href: string
}) {
  const glow = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'
  const style: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    borderRadius: 9999,
    padding: '14px 48px',
    fontSize: 16,
    letterSpacing: '.15em',
    color: '#fff',
    background: '#000',
    textDecoration: 'none',
    boxShadow: `inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)`,
  }
  const highlight: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 9999,
    background:
      'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
    opacity: 0.3,
    pointerEvents: 'none',
  }

  // “確実にアンカー”として動かすため legacyBehavior + <a>
  return (
    <Link href={href} prefetch={false} legacyBehavior>
      <a
        style={style}
        // :active 代わりの最小演出（クリックは妨げない）
        onMouseDown={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            `0 0 12px ${glow}, 0 0 24px ${glow}, 0 0 48px ${glow}`
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)'
        }}
      >
        {label}
        <span aria-hidden style={highlight} />
      </a>
    </Link>
  )
}

/* ===== ページ本体 ===== */
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
          style={styles.bg}            // ← 背景は絶対に背面＆クリック無効
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
          style={styles.bg as CSSProperties} // ← 背景は絶対に背面＆クリック無効
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

/* ===== styles ===== */
const styles: Record<string, CSSProperties> = {
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
    zIndex: -1,               // ★ 前面を覆わせない
    pointerEvents: 'none',    // ★ クリックを絶対に奪わせない
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'calc(env(safe-area-inset-bottom,0) + 6vh)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,               // ★ 前面に固定
  },
  buttonRow: { display: 'flex', gap: 18 },
}
