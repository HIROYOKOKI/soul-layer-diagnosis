'use client'

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'

export default function LoginLanding() {
  return (
    <main style={styles.page}>
      {/* 前景コンテンツ */}
      <section style={styles.card}>
        <h1 style={styles.title}>EVΛƎ · Login</h1>
        <p style={styles.subtitle}>あなたの意識の軌跡に、静かな光を。</p>
        <div style={styles.row}>
          <DomeButton
            label="はじめて"
            variant="pink"
            onClick={() => (location.href = '/login/form?mode=signup')}
          />
          <DomeButton label="ログイン" variant="blue" href="/login/form" />
        </div>
      </section>

      {/* 背景（背面固定） */}
      <div style={styles.bg} aria-hidden>
        <div style={styles.aura} />
        <div style={styles.aura2} />
        <div style={styles.noise} />
      </div>

      {/* keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.98); opacity: .7; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(0.98); opacity: .7; }
        }
        @keyframes drift {
          0% { transform: translateY(0); opacity: .35; }
          50% { transform: translateY(-12px); opacity: .6; }
          100% { transform: translateY(0); opacity: .35; }
        }
      `}</style>
    </main>
  )
}

/* ===== DomeButton（Linkを直接スタイル） ===== */
function DomeButton({
  label,
  variant,
  onClick,
  href,
}: {
  label: string
  variant: 'pink' | 'blue'
  onClick?: () => void
  href?: string
}) {
  const [pressed, setPressed] = useState(false)
  const glow = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'
  const baseStyle: CSSProperties = {
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
    transition: 'box-shadow .15s ease',
  }

  const core = (
    <>
      {label}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background:
            'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      />
    </>
  )

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'inline-block',
        borderRadius: 9999,
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform .15s ease',
      }}
    >
      {href ? (
        <Link href={href} style={baseStyle}>
          {core}
        </Link>
      ) : (
        <button type="button" onClick={onClick} style={baseStyle}>
          {core}
        </button>
      )}
    </div>
  )
}

/* ===== styles ===== */
const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    background: '#0b0b0b',
    color: '#fff',
    overflow: 'hidden',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gap: 16,
    textAlign: 'center',
    padding: '28px 28px 32px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(2px)',
    boxShadow: '0 10px 40px rgba(0,0,0,.35)',
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '.08em' },
  subtitle: { margin: '2px 0 8px', opacity: 0.8 },
  row: { display: 'flex', gap: 12, justifyContent: 'center' },

  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,            // 重要：前面を覆わない
    pointerEvents: 'none',
    background: 'radial-gradient(50% 40% at 50% 60%, #112233 0%, #000 70%)',
  },
  aura: {
    position: 'absolute',
    left: '50%',
    top: '58%',
    width: 520,
    height: 520,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(79,195,255,.28), rgba(0,0,0,0) 60%)',
    filter: 'blur(24px)',
    animation: 'pulse 6s ease-in-out infinite',
  },
  aura2: {
    position: 'absolute',
    left: '65%',
    top: '28%',
    width: 260,
    height: 260,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(255,79,223,.22), rgba(0,0,0,0) 60%)',
    filter: 'blur(18px)',
    animation: 'drift 8s ease-in-out infinite',
  },
  noise: {
    position: 'absolute',
    inset: 0,
    opacity: 0.07,
    backgroundImage:
      'radial-gradient(circle at 10% 20%, #fff2 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, #fff1 0.5px, transparent 0.5px)',
    backgroundSize: '120px 120px, 160px 160px',
  },
}
