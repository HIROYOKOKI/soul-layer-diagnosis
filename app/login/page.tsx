'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'

/* ========= ドーム型ボタン（黒ベース／variantで発光色切替） ========= */
function DomeButton({ label, variant }: { label: string; variant: 'pink' | 'blue' }) {
  const [pressed, setPressed] = useState(false)
  const lift = pressed ? 0 : 2
  const glow = variant === 'pink' ? 'rgba(236,72,153,.55)' : 'rgba(14,165,233,.55)'
  const glowSoft = variant === 'pink' ? 'rgba(236,72,153,.35)' : 'rgba(14,165,233,.35)'

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: 9999,
        transform: pressed ? 'translateY(1px) scale(0.995)' : `translateY(-${lift}px)`,
        transition: 'transform .16s ease',
        // 浮遊影（2層）
        boxShadow: pressed
          ? '0 8px 16px rgba(0,0,0,.45), 0 3px 8px rgba(0,0,0,.35)'
          : '0 22px 32px rgba(0,0,0,.45), 0 8px 16px rgba(0,0,0,.35)',
      }}
    >
      <button
        type="button"
        style={{
          position: 'relative',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          borderRadius: 9999,
          padding: '14px 48px',
          minHeight: 48,
          color: '#fff',
          letterSpacing: '.18em',
          fontSize: 16,
          // ベース色（CMYK c94 m91 y82 k75 ≒ #0a0a0a）
          background: '#0a0a0a',
          // ドームの内側の質感（光沢＋陰影）
          boxShadow:
            'inset 0 1px 1px rgba(255,255,255,.22), inset 0 -2px 4px rgba(0,0,0,.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          overflow: 'hidden',
        }}
      >
        {/* 上面ハイライト */}
        <span
          aria-hidden
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 10, right: 10, top: 6, height: 10,
            borderRadius: 9999,
            background: 'linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))',
            filter: 'blur(1px)',
          }}
        />
        {/* 下面リムライト（variant色のニュアンス） */}
        <span
          aria-hidden
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 8, right: 8, bottom: 5, height: 12,
            borderRadius: 9999,
            background: `linear-gradient(180deg, ${glowSoft}, rgba(0,0,0,0))`,
            filter: 'blur(2px)',
          }}
        />
        {/* クリック時の内側発光（variant色のみ） */}
        {pressed && (
          <span
            aria-hidden
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 9999,
              background: `radial-gradient(120% 120% at 50% 50%, ${glow} 0%, rgba(255,255,255,.15) 55%, rgba(255,255,255,0) 65%)`,
              animation: 'domeFlash .35s ease-out forwards',
            } as CSSProperties}
          />
        )}
        {label}
        {/* keyframes を JSX 内に安全に定義 */}
        <style jsx>{`
          @keyframes domeFlash {
            0%   { opacity: .9; transform: scale(0.85); }
            70%  { opacity: .4; transform: scale(1.15); }
            100% { opacity: 0;  transform: scale(1.35); }
          }
        `}</style>
      </button>
    </div>
  )
}

/* ========= ページ本体 ========= */
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

      <div style={styles.bottomBlock}>
        <div style={{ ...styles.buttonRow, opacity: phase === 'still' ? 1 : 0 }}>
          {/* 左=ピンク発光 ／ 右=青発光 */}
          <DomeButton label="はじめて" variant="pink" />
          <DomeButton label="ログイン" variant="blue" />
        </div>
      </div>
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
