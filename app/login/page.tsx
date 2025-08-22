'use client'
import type { CSSProperties } from 'react'

export default function LoginDebug() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#000',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景動画：必ず背面・クリック無効 */}
      <div style={bgWrap} aria-hidden>
        <video
          src="/login-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/login-still.png"
          style={bgMedia}
        />
      </div>

      {/* 前景：遷移確認用の生リンク */}
      <div style={{ display: 'grid', gap: 12, textAlign: 'center', zIndex: 10 }}>
        <h1 style={{ margin: 0 }}>LOGIN DEBUG</h1>
        <a href="/login/form" style={btn}>/login/form へ</a>
        <a href="/login/form?mode=signup" style={btn}>/login/form?mode=signup へ</a>
      </div>
    </main>
  )
}

/* ===== styles ===== */
const bgWrap: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: -1,           // ← 背面固定
  pointerEvents: 'none' // ← クリックを奪わせない
}

const bgMedia: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const btn: CSSProperties = {
  display: 'inline-block',
  padding: '12px 18px',
  borderRadius: 12,
  background: '#1e90ff',
  color: '#fff',
  textDecoration: 'none'
}
