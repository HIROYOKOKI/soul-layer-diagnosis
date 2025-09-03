// components/GlowButton.tsx
"use client"

import React, { useState } from "react"

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ")
}

type Variant = "primary" | "secondary" | "violet"
type Size = "sm" | "md" | "lg"

export default function GlowButton({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}) {
  const [pressed, setPressed] = useState(false)

  const sizeCls =
    size === "sm" ? "h-10 px-5 text-sm" :
    size === "lg" ? "h-14 px-8 text-lg" :
    "h-12 px-6"

  // 通常時のグラデ
  const baseGrad =
    variant === "primary"
      ? "from-cyan-500 to-indigo-500"
      : variant === "secondary"
      ? "from-slate-600 to-slate-700"
      : "from-violet-500 to-fuchsia-500"

  // 押下中の“画像くらいの発色”パープル（濃い→明るい）
  const pressedGrad = "from-[#6D28D9] via-[#7C3AED] to-[#C026D3]" // deep violet → vivid

  // 外周グロー（押下時は紫寄りに強化）
  const baseGlow =
    "shadow-[0_0_28px_rgba(56,189,248,.32)] hover:shadow-[0_0_50px_rgba(99,102,241,.65)]"
  const pressedGlow =
    "shadow-[0_0_90px_rgba(217,70,239,.9),0_0_50px_rgba(168,85,247,.75)]"

  // パープルのリップル
  const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return
    setPressed(true)
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement("span")
    Object.assign(ripple.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: "24px",
      height: "24px",
      borderRadius: "9999px",
      pointerEvents: "none",
      transform: "translate(-50%,-50%) scale(0)",
      opacity: "0.95",
      filter: "drop-shadow(0 0 14px rgba(217,70,239,.70))",
      mixBlendMode: "screen",
      background:
        "radial-gradient(closest-side, rgba(168,85,247,0.95), rgba(217,70,239,0.45) 40%, rgba(217,70,239,0.12) 70%, transparent)",
      transition: "transform 650ms ease-out, opacity 650ms ease-out",
    } as CSSStyleDeclaration)
    btn.appendChild(ripple)
    requestAnimationFrame(() => {
      ripple.style.transform = "translate(-50%,-50%) scale(6.2)"
      ripple.style.opacity = "0"
    })
    ripple.addEventListener("transitionend", () => ripple.remove())
  }

  const release = () => setPressed(false)

  return (
    <button
      {...props}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      className={cx(
        "relative inline-flex items-center justify-center rounded-full font-semibold tracking-wide select-none",
        "transition will-change-transform active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "text-white border border-white/10 overflow-hidden", // rippleを内側に
        `bg-gradient-to-r ${pressed ? pressedGrad : baseGrad}`,
        pressed ? pressedGlow : baseGlow,
        sizeCls,
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* 常時うっすら紫ハロー（押下時は強めの外周で上書き） */}
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute -z-10 inset-0 rounded-full blur-2xl",
          pressed ? "opacity-70 bg-[radial-gradient(closest-side,rgba(217,70,239,.45),transparent_70%)]"
                  : "opacity-45 bg-[radial-gradient(closest-side,rgba(217,70,239,.28),transparent_70%)]"
        )}
      />
      {children}
    </button>
  )
}
