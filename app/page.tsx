'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'   // ← 別名で読み込む

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
    v.addEventListener('ended', onEnded)

    // ← ここがポイント：ブラウザのコンストラクタを使う
    const img = new window.Image()
    img.src = '/login-still.png'

    return () => { clearTimeout(to); v.removeEventListener('ended', onEnded) }
  }, [])

  return (
    <div className="relative min-h-[100svh] bg-black text-white">
      {phase === 'video' ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/login-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/login-still.png"
        />
      ) : (
        <NextImage               // ← NextImage を使う
          src="/login-still.png"
          alt="login still"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className="relative z-10 flex min-h-[100svh] items-end justify-center pb-16">
        <div
          className="flex gap-6 opacity-0 transition-opacity duration-500 data-[show='1']:opacity-100"
          data-show={phase === 'still' ? '1' : '0'}
        >
          <NeonButton href="/daily/question" label="初めての方はこちらから" />
          <NeonButton href="/signin" label="ログイン" variant="pink" />
        </div>

        {phase === 'video' && (
          <button
            onClick={() => setPhase('still')}
            className="absolute bottom-5 right-5 rounded-full border border-white/40 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            スキップ
          </button>
        )}
      </div>
    </div>
  )
}

function NeonButton({
  href, label, variant = 'cyan',
}: { href: string; label: string; variant?: 'cyan'|'pink' }) {
  const conic =
    variant === 'cyan'
      ? 'conic-gradient(from 180deg, rgba(14,165,233,.95), rgba(99,102,241,.95), rgba(236,72,153,.95), rgba(14,165,233,.95))'
      : 'conic-gradient(from 180deg, rgba(236,72,153,.95), rgba(99,102,241,.95), rgba(14,165,233,.95), rgba(236,72,153,.95))'
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-2 rounded-full blur-xl opacity-60" style={{ background: conic }} />
      <div className="relative inline-flex rounded-full p-[3px]" style={{ background: conic }}>
        <Link href={href} className="rounded-full bg-black/85 px-7 py-3 text-sm hover:scale-[1.02] transition">
          {label}
        </Link>
      </div>
    </div>
  )
}
