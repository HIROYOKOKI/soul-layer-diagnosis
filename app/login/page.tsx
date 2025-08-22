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

  // ブルー→ピンクの軸は維持
  const rail = 'linear-gradient(90deg, rgba(14,165,233,.95), rgba(236,72,153,.95))'

  // 発光は控えめ、輪郭をくっきり
  const outerGlow = hovered ? 24 : 18
  const glowAlpha = active ? 0.85 : hovered ? 0.55 : 0.35
  const scale = active ? 0.98 : hovered ? 1.01 : 1

  return (
    <div
      style={{ position:'relative', transform:`scale(${scale})`, transition:'transform .16s ease' }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)}
      onMouseDown={()=>setActive(true)} onMouseUp={()=>setActive(false)}
      onTouchStart={()=>setActive(true)} onTouchEnd={()=>setActive(false)}
    >
      {/* 外側の控えめネオン */}
      <div
        aria-hidden
        style={{
          position:'absolute', inset:-6, borderRadius:12,
          filter:`blur(${outerGlow}px)`,
          opacity: glowAlpha,
          background: rail,
          transition:'filter .16s ease, opacity .16s ease'
        }}
      />
      {/* 境界（くっきりしたレール） */}
      <div
        style={{
          position:'relative', display:'inline-flex',
          borderRadius:12, padding:2, background: rail,
          // 発光は軽く、縁を際立たせる
          boxShadow:`0 0 ${12 + (hovered?8:0)}px rgba(14,165,233,${glowAlpha*0.45}),
                     0 0 ${12 + (hovered?8:0)}px rgba(236,72,153,${glowAlpha*0.45})`,
          transition:'box-shadow .16s ease'
        }}
      >
        <button
          type="button"
          onClick={(e)=>e.preventDefault()}
          style={{
            border:'none', outline:'none', cursor:'pointer',
            borderRadius:10,
            // 微ガラス（内側グラデ）
            background: 'linear-gradient(180deg, rgba(0,0,0,.82), rgba(0,0,0,.9))',
            // 1px の内側エッジで精密感
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,.12),
                        inset 0 -1px 0 rgba(255,255,255,.06)`,
            // サイズ感：低め＆ワイド
            padding:'12px 28px',
            minHeight: 44,
            color:'#fff',
            fontSize:16,
            letterSpacing:'.18em',
            // アクティブ時の押し込み表現
            transform: active ? 'translateY(1px)' : 'none',
            transition:'transform .06s ease, box-shadow .16s ease'
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
