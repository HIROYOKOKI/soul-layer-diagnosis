'use client'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'

/** ← デバッグ用の“絶対に見える”ログインページ */
export default function LoginPageDebug() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: '#0b0b0b',
        display: 'grid',
        placeItems: 'center',
        zIndex: 0,               // 背景より前
        opacity: 1,              // フェーズ無視で固定表示
      }}
    >
      <div
        style={{
          zIndex: 10,            // 何があっても前面
          color: '#fff',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          flexDirection: 'column',
          border: '1px dashed #666', // 目視用
          padding: 24,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>EVΛƎ · Login</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <DomeButton label="はじめて" variant="pink" onClick={() => alert('onboarding')} />
          <DomeButton label="ログイン" variant="blue" href="/login/form" />
        </div>
        <p style={{ margin: 0, fontSize: 12, opacity: .7 }}>
          ※デバッグ版：opacity固定・z-index固定・背景は下層に固定
        </p>
      </div>

      {/* 背景（常に背面 & イベント無効） */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,            // ← これ超重要：必ず背面！
          pointerEvents: 'none', // 背景がクリックを奪わない
          background:
            'radial-gradient(50% 40% at 50% 50%, #123 0%, #000 70%)',
        }}
      />
    </main>
  )
}

/* ====== あなたのDomeButton（Link版） ====== */
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
  const glowColor = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'
  const glowShadow =
    variant === 'pink'
      ? '0 0 12px #ff4fdf, 0 0 24px #ff4fdf, 0 0 48px #ff4fdf'
      : '0 0 12px #4fc3ff, 0 0 24px #4fc3ff, 0 0 48px #4fc3ff'

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
    letterSpacing: '.15em',
    color: '#fff
