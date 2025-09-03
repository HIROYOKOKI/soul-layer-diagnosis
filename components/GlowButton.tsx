// components/GlowButton.tsx
"use client"

import React from "react"

type Variant = "primary" | "violet" | "secondary"
type Size = "sm" | "md" | "lg"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

/* ちいさな class 連結ヘルパ */
function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ")
}

/* パープルのRGBAを楽に使う */
const PURPLE_MAIN = "rgba(168,85,247,1)"   // #a855f7
const FUCHSIA     = "rgba(217,70,239,1)"   // #d946ef
const PURPLE_SOFT = "rgba(168,85,247,.55)"
const PURPLE_DIM  = "rgba(168,85,247,.28)"

export default function GlowButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: Props) {
  const isDisabled = disabled || loading

  const sizeCls =
    size === "sm" ? "h-10 px-5 text-sm" :
    size === "lg" ? "h-14 px-8 text-lg" :
    "h-12 px-6"

  /* 基本グラデ（見た目の色味） */
  const grad =
    variant === "primary"   ? "from-cyan-500 to-indigo-500" :
    variant === "secondary" ? "from-slate-600 to-slate-700" :
                              "from-violet-500 to-fuchsia-500" // violet

  /* 外周グロー（hover/activeで強め、常時も薄く） */
  const haloShadow =
    variant === "secondary"
      ? "shadow-[0_0_22px_rgba(148,163,184,.28)] hover:shadow-[0_0_34px_rgba(148,163,184,.45)]"
      : "shadow-[0_0_30px_rgba(168,85,247,.40)] hover:shadow-[0_0_52px_rgba(217,70,239,.75)]" // ← デフォは紫寄り

  /* リップル色（primaryでも “押下時は紫” に統一） */
  const rippleColorMain = PURPLE_MAIN
  const rippleColorSoft = PURPLE_SOFT

  /* クリック/タップのリップル生成（紫を強く） */
  const spawnRipple = (btn: HTMLButtonElement, x: number, y: number) => {
    const span = document.createElement("span")
    span.style.position = "absolute"
    span.style.left = `${x}px`
    span.style.top  = `${y}px`
    span.style.width = "24px"
    span.style.height = "24px"
    span.style.borderRadius = "9999px"
    span.style.pointerEvents = "none"
    span.style.transform = "translate(-50%, -50%) scale(0)"
    span.style.opacity = "0.95"
    span.style.background = `radial-gradient(closest-side, ${rippleColorMain} 0%, ${rippleColorSoft} 45%, rgba(168,85,247,.14) 70%, transparent 100%)`
    span.style.filter = "drop-shadow(0 0 14px rgba(217,70,239,.55))"
    span.style.animation = "evae-ripple 700ms ease-out forwards"
    btn.appendChild(span)
    span.addEventListener("animationend", () => span.remove())
  }

  const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (isDisabled) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    spawnRipple(btn, e.clientX - rect.left, e.clientY - rect.top)
  }

  const onTouchStart: React.TouchEventHandler<HTMLButtonElement> = (e) => {
    if (isDisabled) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const t = e.touches[0]
    spawnRipple(btn, t.clientX - rect.left, t.clientY - rect.top)
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      className={cx(
        "relative inline-flex items-center justify-center rounded-full font-semibold tracking-wide select-none",
        "transition will-change-transform active:scale-[0.98]",
        "text-white border border-white/10",
        `bg-gradient-to-r ${grad}`,
        haloShadow,
        sizeCls,
        isDisabled && "opacity-60 cursor-not-allowed",
        className
      )}
      style={{ overflow: "visible" }} // グロー/リップルを切らない
    >
      {/* 紫のハローを常時うっすら（variantに関係なく“世界観”を揃える） */}
      <span
        aria-hidden
        className="pointer-events-none absolute -z-10 inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background: `radial-gradient(closest-side, ${PURPLE_DIM}, transparent 70%)`,
        }}
      />

      {children}

      {/* ローディング表示（必要なら） */}
      {loading && (
        <span
          aria-hidden
          className="absolute right-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
        />
      )}

      {/* リップル用のキーフレーム（ボタン単体で完結） */}
      <style jsx>{`
        @keyframes evae-ripple {
          0%   { transform: translate(-50%, -50%) scale(0);   opacity: .95; }
          70%  { transform: translate(-50%, -50%) scale(5.2); opacity: .22; }
          100% { transform: translate(-50%, -50%) scale(6.2); opacity: 0;   }
        }
      `}</style>
    </button>
  )
}
