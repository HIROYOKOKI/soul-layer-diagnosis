'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'

/* ========= ドーム型ボタン（黒ベース／variantで発光色切替） ========= */
function DomeButton({ label, variant }: { label: string; variant: 'pink' | 'blue' }) {
  const [pressed, setPressed] = useState(false)

  const glowColor = variant === 'pink' ? '#ff4fdf' : '#4fc3ff'  // 彩度を上げてネオンっぽく
  const glowShadow = variant === 'pink'
    ? '0 0 12px #ff4fdf, 0 0 24px #ff4fdf, 0 0 48px #ff4fdf'
    : '0 0 12px #4fc3ff, 0 0 24px #4fc3ff, 0 0 48px #4fc3ff'

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display:'inline-block',
        borderRadius:9999,
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition:'transform .15s ease'
      }}
    >
      <button
        type="button"
        style={{
          position:'relative',
          border:'none',
          outline:'none',
          cursor:'pointer',
          borderRadius:9999,
          padding:'14px 48px',
          fontSize:16,
          letterSpacing:'.15em',
          color:'#fff',
          background:'#000',
          overflow:'hidden',
          // 押したとき → ネオン全開
          boxShadow: pressed ? glowShadow : 'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)'
        }}
      >
        {label}

        {/* 常時ハイライト（ガラス感） */}
        <span aria-hidden style={{
          position:'absolute',
          inset:0,
          borderRadius:9999,
          background:'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
          opacity:.3,
          pointerEvents:'none'
        }}/>

        {/* 押したときだけ拡散光（アニメ付き） */}
        {pressed && (
          <span aria-hidden style={{
            position:'absolute',
            inset:-20,
            borderRadius:9999,
            background:`radial-gradient(circle, ${glowColor}88 0%, transparent 70%)`,
            filter:'blur(18px)',
            animation:'neonPulse .4s ease-out'
          }}/>
        )}

        <style jsx>{`
          @keyframes neonPulse {
            0%   { opacity: 1; transform: scale(0.8); }
            70%  { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 0;   transform: scale(1.4); }
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
