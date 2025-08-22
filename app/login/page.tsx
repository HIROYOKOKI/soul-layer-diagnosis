'use client'
import { useState, type CSSProperties } from 'react'
import Link from 'next/link'

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
    color: '#fff',
    background: '#000',
    overflow: 'hidden',
    boxShadow: pressed
      ? glowShadow
      : 'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)',
  }

  const CoreChildren = (
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
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
      {pressed && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
            filter: 'blur(18px)',
            animation: 'neonPulse .4s ease-out',
          }}
        />
      )}
      <style jsx>{`
        @keyframes neonPulse {
          0% {
            opacity: 1;
            transform: scale(0.8);
          }
          70% {
            opacity: 0.7;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }
      `}</style>
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
          {CoreChildren}
        </Link>
      ) : (
        <button type="button" onClick={onClick} style={baseStyle}>
          {CoreChildren}
        </button>
      )}
    </div>
  )
}

export default DomeButton
