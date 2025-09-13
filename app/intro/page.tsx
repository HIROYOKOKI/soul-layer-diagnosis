'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import LoginIntro from "@/components/LoginIntro";
export default function IntroPage() {
  return <LoginIntro />;
}
type Phase = 'video' | 'still';

export default function LoginIntro() {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const failSafeRef = useRef<number | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // アクセシビリティ：reduce motion の人には静止画のみ
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setPhase('still');
      return;
    }

    // iOS対策（自動再生必須条件）
    v.muted = true;
    (v as any).playsInline = true;

    // タブ非表示中は静止画に
    const onVisibility = () => {
      if (document.hidden) {
        setPhase('still');
        v.pause();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPhase('still'));

    const onEnded = () => setPhase('still');
    const onError = () => setPhase('still');
    v.addEventListener('ended', onEnded);
    v.addEventListener('error', onError);

    // fail-safe（モバイル端末で ended が発火しないケース）
    failSafeRef.current = window.setTimeout(() => setPhase('still'), 4500);

    return () => {
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVisibility);
      if (failSafeRef.current) {
        clearTimeout(failSafeRef.current);
        failSafeRef.current = null;
      }
    };
  }, []);

  const videoOpacity = phase === 'video' && playing ? 1 : 0;
  const imageOpacity = phase === 'still' ? 1 : 0;
  const buttonsOpacity = phase === 'still' ? 1 : 0;

  return (
    <main style={styles.page}>
      {/* 背景（動画→静止画クロスフェード） */}
      <div style={styles.bgStack} aria-hidden>
        <img
          src="/login-still.png"
          alt=""
          decoding="async"
          loading="eager"
          style={{ ...styles.bgMedia, opacity: imageOpacity }}
        />
        <video
          ref={videoRef}
          src="/login-intro.mp4"
          poster="/login-still.png"
          autoPlay
          muted
          playsInline
          preload="auto"
          style={{ ...styles.bgMedia, opacity: videoOpacity }}
        />
      </div>

      {/* 下部ボタン（静止画フェーズでフェードイン） */}
      <div style={styles.bottomBlock}>
        <div style={{ ...styles.buttonRow, opacity: buttonsOpacity }}>
          <GlowButton href="/signup" variant="pink" ariaLabel="新規登録へ">
            新規登録
          </GlowButton>
          <GlowButton href="/login/email" variant="blue" ariaLabel="ログインへ">
            ログイン
          </GlowButton>
        </div>
      </div>

      {/* リップル用キーフレーム */}
      <style jsx global>{`
        @keyframes evaeRipple {
          0%   { transform: translate(-50%, -50%) scale(0);  opacity: .9; }
          70%  { transform: translate(-50%, -50%) scale(8);  opacity: .45; }
          100% { transform: translate(-50%, -50%) scale(12); opacity: 0; }
        }
      `}</style>
    </main>
  );
}

/* ---------- GlowButton (Next.js Link + ripple & glow) ---------- */
function GlowButton({
  href,
  children,
  variant,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant: 'pink' | 'blue';
  ariaLabel?: string;
}) {
  const glow = variant === 'pink' ? 'rgba(255,79,223,.65)' : 'rgba(79,195,255,.65)';
  const baseShadow =
    'inset 0 1px 2px rgba(255,255,255,.15), inset 0 -2px 6px rgba(0,0,0,.5)';

  const pressedShadow = `0 0 14px ${glow}, 0 0 28px ${glow}`;

  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const a = e.currentTarget as HTMLAnchorElement;
    const rect = a.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // temporary glow
    a.style.boxShadow = pressedShadow;

    // ripple element
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '14px';
    ripple.style.height = '14px';
    ripple.style.borderRadius = '9999px';
    ripple.style.background = `radial-gradient(circle, ${glow} 0%, transparent 60%)`;
    ripple.style.filter = 'blur(6px)';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'evaeRipple .45s ease-out forwards';

    a.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLAnchorElement>) => {
    (e.currentTarget as HTMLAnchorElement).style.boxShadow = baseShadow;
  };

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: 'relative',
        display: 'inline-block',
        textDecoration: 'none',
        borderRadius: 9999,
        padding: '14px 48px',
        color: '#fff',
        background: '#000',
        boxShadow: baseShadow,
        overflow: 'hidden', // ripple を内側にクリップ
      }}
    >
      {children}
      {/* glass highlight */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: 'linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,0))',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
    </Link>
  );
}

/* ---------- styles ---------- */
const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    background: '#000',
    color: '#fff',
    overflow: 'hidden',
  },
  bgStack: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none', // 背景はクリック不可
  },
  bgMedia: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: '50% 50%',
    transition: 'opacity .6s ease',
    opacity: 0,
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 'calc(env(safe-area-inset-bottom, 0) + 6vh)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  buttonRow: {
    display: 'flex',
    gap: 18,
    transition: 'opacity .6s ease',
    zIndex: 10,           // ボタンを前面に
    position: 'relative', // ripple の座標基準
  },
};
