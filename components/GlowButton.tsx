// components/GlowButton.tsx
'use client'

import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
}

export default function GlowButton({ children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        ...S.button,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const glow = '0 0 12px rgba(0,180,255,.7), 0 0 24px rgba(150,0,255,.6)'

const S: Record<string, React.CSSProperties> = {
  button: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    border: 'none',
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '.08em',
    background: 'linear-gradient(90deg,#0af,#a0f)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: glow,
    transition: 'background-position .3s ease, transform .1s ease',
    backgroundSize: '200% auto',
  },
}
