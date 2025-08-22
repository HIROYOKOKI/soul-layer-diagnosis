'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

      {/* ボタン：ドーム型ガラス */}
   function DomeButton({ label }: { label: string }) {
  const [pressed, setPressed] = useState(false)

  // エレベーション（浮遊感）— hoverで少し上がる、押すと沈む
  const lift = pressed ? 0 : 2

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
        padding: 0,
        borderRadius: 9999,
        // 外側の細いフチ（ごく薄いグレー）— ガラスの縁
        background: 'rgba(255,255,255,0.06)',
        // 浮遊影（2層）：ぼかし大＋小で床面との距離感を出す
        boxShadow:
          pressed
            ? '0 6px 12px rgba(0,0,0,.45), 0 2px 4px rgba(0,0,0,.35)'
            : '0 18px 28px rgba(0,0,0,.45), 0 6px 12px rgba(0,0,0,.35)',
        transform: pressed ? 'translateY(1px) scale(0.995)' : `translateY(-${lift}px)`,
        transition: 'transform .16s ease, box-shadow .18s ease, background .2s ease',
      }}
    >
      {/* 実体（黒いドーム＋内側グラデ） */}
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
          // ドーム感：上明るめ→下暗めのグラデ＋わずかな透明感
          background: 'linear-gradient(180deg, rgba(30,30,35,.65), rgba(5,5,10,.9))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          // 内側のエッジ（ガラスっぽい縁）
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,.22), inset 0 -2px 4px rgba(0,0,0,.55)',
          overflow: 'hidden',
        }}
      >
        {/* 上面ハイライト（細い光の帯） */}
        <span
          aria-hidden
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 10,
            right: 10,
            top: 5,
            height: 10,
            borderRadius: 9999,
            background:
              'linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))',
            filter: 'blur(1px)',
          }}
        />
        {/* 下面リムライト（下端にかける青みの縁光） */}
        <span
          aria-hidden
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 4,
            height: 12,
            borderRadius: 9999,
            background:
              'linear-gradient(180deg, rgba(56,189,248,.20), rgba(56,189,248,0))',
            filter: 'blur(2px)',
            opacity: .9,
          }}
        />
        {/* 内側グロウ（クリック時だけドーム内が発光） */}
        {pressed && (
          <span
            aria-hidden
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 9999,
              background:
                'radial-gradient(120% 120% at 50% 50%, rgba(236,72,153,.55) 0%, rgba(14,165,233,.45) 45%, rgba(255,255,255,.15) 60%, rgba(255,255,255,0) 65%)',
              animation: 'domeFlash .35s ease-out forwards',
            } as CSSProperties}
          />
        )}

        {label}

        {/* キーアニメーション（inline） */}
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


/* ========= styles ========= */
const styles = {
  root: { position:'relative', minHeight:'100dvh', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' },
  bottomBlock: { position:'absolute', left:0, right:0, bottom:'calc(env(safe-area-inset-bottom,0) + 6vh)', display:'flex', justifyContent:'center', alignItems:'center' },
  buttonRow: { display:'flex', gap:18, transition:'opacity .35s ease' },
} satisfies Record<string, CSSProperties>
