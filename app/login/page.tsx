'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NextImage from 'next/image'

/* ========= ドーム型ボタン（黒ベース／variantで発光色切替） ========= */
function DomeButton({ label, variant }: { label: string; variant: 'pink' | 'blue' }) {
  const [pressed, setPressed] = useState(false)

  // 発光色（押した時だけ使う）
  const glowColor = variant === 'pink' ? '#ec4899' : '#0ea5e9'

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position:'relative',
        display:'inline-block',
        borderRadius:9999,
        // 浮遊影（通常時のみ。押下時は沈む）
        boxShadow: pressed ? '0 8px 14px rgba(0,0,0,.45)' : '0 22px 34px rgba(0,0,0,.5), 0 8px 16px rgba(0,0,0,.35)',
        transform: pressed ? 'translateY(1px) scale(.995)' : 'translateY(-2px)',
        transition:'transform .12s ease, box-shadow .18s ease'
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
          minHeight:48,
          color:'#fff',
          letterSpacing:'.18em',
          fontSize:16,
          // ★通常は“真っ黒”のみ（ガラス質のドーム感は内側の光沢で表現）
          background:'#0a0a0a',
          boxShadow:'inset 0 1px 1px rgba(255,255,255,.22), inset 0 -2px 4px rgba(0,0,0,.55)',
          overflow:'hidden'
        }}
      >
        {/* 上面ハイライト（常時） */}
        <span aria-hidden style={{
          pointerEvents:'none', position:'absolute', left:10, right:10, top:6, height:10,
          borderRadius:9999,
          background:'linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))',
          filter:'blur(1px)'
        }}/>

        {/* ★押下時だけ：外周ネオン輪郭＋内側全面発光 */}
        {pressed && (
          <>
            {/* 外周の強いネオン輪郭 */}
            <span aria-hidden style={{
              pointerEvents:'none', position:'absolute', inset:-2, borderRadius:9999,
              boxShadow:`0 0 24px ${glowColor}, 0 0 64px ${glowColor}`,
              border:`2px solid ${glowColor}`,
              opacity:.95
            }}/>
            {/* 内側のネオン塗り（中央ほど明るい） */}
            <span aria-hidden style={{
              pointerEvents:'none', position:'absolute', inset:0, borderRadius:9999,
              background:`radial-gradient(120% 120% at 50% 50%, ${glowColor} 0%, rgba(255,255,255,.25) 55%, rgba(255,255,255,0) 65%)`,
              animation:'flashFill .35s ease-out forwards'
            } as CSSProperties}/>
          </>
        )}

        {label}

        {/* keyframes */}
        <style jsx>{`
          @keyframes flashFill {
            0%   { opacity: .95; transform: scale(.9); }
            70%  { opacity: .45; transform: scale(1.15); }
            100% { opacity: 0;   transform: scale(1.28); }
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
