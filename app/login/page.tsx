'use client'
import { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'

type Phase = 'video' | 'still'

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setPhase('still'); return }

    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.playsInline = true
    v.play().catch(() => setPhase('still'))

    const to = setTimeout(() => setPhase('still'), 3400)
    const onEnded = () => setPhase('still')
    const onError = () => setPhase('still')
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)

    // 切替チラつき防止の先読み（NextのImageと衝突しないように window.Image を使用）
    const img = new window.Image()
    img.src = '/login-still.png'

    return () => { clearTimeout(to); v.removeEventListener('ended', onEnded); v.removeEventListener('error', onError) }
  }, [])

  return (
    <div style={styles.root}>
      {/* 背景：動画 or 静止画 */}
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
        <NextImage src="/login-still.png" alt="login still" fill priority style={styles.bg as any}/>
      )}

      {/* ロゴ＆コピー */}
      <div style={styles.topBlock}>
        <div style={styles.logo}>EVΛƎ</div>
        <div style={styles.logoSub}>ENERGY VISION AWAKENING ECHO</div>
        <h1 style={styles.title}>ソウル レイヤー診断</h1>
        <p style={styles.subtitle}>Soul Layer Diagnosis</p>
      </div>

      {/* ボタン群（今日はリンクなし／見た目だけ） */}
      <div style={styles.bottomBlock}>
        <div style={{...styles.buttonRow, opacity: phase === 'still' ? 1 : 0}}>
          <NeonButton label="初めての方はこちらから" />
          <NeonButton label="ログイン" variant="pink" />
        </div>

        {/* スキップ（任意） */}
        {phase === 'video' && (
          <button onClick={() => setPhase('still')} style={styles.skip}>スキップ</button>
        )}
      </div>
    </div>
  )
}

/* ====== デザイン用コンポーネント（リンク動作なし） ====== */
function NeonButton({ label, variant = 'cyan' }: { label: string; variant?: 'cyan'|'pink' }) {
  const conic =
    variant === 'cyan'
      ? 'conic-gradient(from 180deg, rgba(14,165,233,.95), rgba(99,102,241,.95), rgba(236,72,153,.95), rgba(14,165,233,.95))'
      : 'conic-gradient(from 180deg, rgba(236,72,153,.95), rgba(99,102,241,.95), rgba(14,165,233,.95), rgba(236,72,153,.95))'
  return (
    <div style={{ position:'relative' }}>
      <div aria-hidden style={{ position:'absolute', inset:-8, borderRadius:9999, filter:'blur(18px)', opacity:.6, background:conic }} />
      <div style={{ position:'relative', display:'inline-flex', borderRadius:9999, padding:3, background:conic, boxShadow:'0 0 30px rgba(56,189,248,.35)' }}>
        <button
          type="button"
          onClick={(e)=>e.preventDefault()} // ← 動作なし
          style={{
            border:'none', outline:'none', cursor:'default',
            borderRadius:9999, background:'rgba(0,0,0,.85)', color:'#fff',
            padding:'12px 22px', fontSize:14, letterSpacing:'.02em'
          }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}

/* ====== inline styles（Tailwind不要で動く） ====== */
const styles: Record<string, React.CSSProperties> = {
  root: { position:'relative', minHeight:'100svh', background:'#000', color:'#fff', overflow:'hidden' },
  bg: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' },
  topBlock: { position:'absolute', top:'9vh', left:0, right:0, textAlign:'center' as const, pointerEvents:'none' },
  logo: { fontSize:48, fontWeight:600, letterSpacing:'0.35em' },
  logoSub: { marginTop:6, fontSize:12, letterSpacing:'0.35em', color:'rgba(255,255,255,.7)' },
  title: { marginTop:28, fontSize:34, fontWeight:600, letterSpacing:'.06em' },
  subtitle: { marginTop:6, fontSize:14, letterSpacing:'.2em', color:'rgba(255,255,255,.8)' },
  bottomBlock: { position:'absolute', left:0, right:0, bottom:'8vh', display:'flex', justifyContent:'center', alignItems:'center' },
  buttonRow: { display:'flex', gap:18, transition:'opacity .5s ease' },
  skip: {
    position:'absolute', right:20, bottom:-26, fontSize:12,
    color:'rgba(255,255,255,.8)', border:'1px solid rgba(255,255,255,.4)',
    background:'transparent', borderRadius:9999, padding:'6px 10px'
  },
}
