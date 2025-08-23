// components/GlowButton.tsx
'use client'

import { useState, type ButtonHTMLAttributes, type CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  glow?: boolean
}

export default function GlowButton({
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  loading = false,
  glow = true,
  style,
  disabled,
  children,
  ...rest
}: Props) {
  const [hover, setHover] = useState(false)
  const t = tokens[variant]

  const height = size === 'lg' ? 52 : 44
  const baseGlow = glow ? `${t.glow1}, ${t.glow2}` : 'none'
  const isDisabled = disabled || loading

  const sx: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    height,
    padding: '0 18px',
    borderRadius: 9999,
    border: '1px solid',
    borderColor: t.border,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    background: t.grad,
    backgroundSize: '200% auto',
    backgroundPosition: hover ? 'right center' : 'left center',
    boxShadow: baseGlow,
    transition: 'background-position .35s ease, transform .08s ease, box-shadow .2s ease, opacity .2s ease',
    transform: hover && !isDisabled ? 'translateY(-0.5px)' : 'none',
    opacity: isDisabled ? 0.55 : 1,
    ...style,
  }

  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setHover(false)}
      style={sx}
    >
      {loading ? 'LOADING…' : children}
    </button>
  )
}

/* ===== Variant Tokens ===== */
const tokens: Record<Variant, {
  grad: string
  border: string
  glow1: string
  glow2: string
}> = {
  primary: {
    // 青→紫（今のSAVEボタンと同系）
    grad: 'linear-gradient(90deg,#0af 0%,#a0f 100%)',
    border: 'rgba(120,160,255,.45)',
    glow1: '0 0 12px rgba(0,180,255,.70)',
    glow2: '0 0 24px rgba(160,0,255,.55)',
  },
  secondary: {
    // シアン→ライム（行動サブ用）
    grad: 'linear-gradient(90deg,#00e5ff 0%,#7dff8a 100%)',
    border: 'rgba(120,255,220,.40)',
    glow1: '0 0 12px rgba(0,229,255,.65)',
    glow2: '0 0 24px rgba(125,255,138,.45)',
  },
  danger: {
    // ピンク→オレンジ（破壊的操作）
    grad: 'linear-gradient(90deg,#ff4fdf 0%,#ff7a3d 100%)',
    border: 'rgba(255,120,150,.45)',
    glow1: '0 0 12px rgba(255,79,223,.65)',
    glow2: '0 0 24px rgba(255,122,61,.45)',
  },
}
