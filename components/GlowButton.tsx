// components/GlowButton.tsx
"use client"

import React from "react"
import clsx from "clsx"

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
  const sizeCls =
    size === "sm" ? "h-10 px-5 text-sm" :
    size === "lg" ? "h-14 px-8 text-lg" :
    "h-12 px-6"

  const variantGrad = {
    primary:  "from-cyan-500 to-indigo-500",
    secondary:"from-slate-600 to-slate-700",
    violet:   "from-violet-500 to-fuchsia-500"
  }[variant]

  const glowShadow = {
    primary:  "shadow-[0_0_28px_rgba(56,189,248,.35)] hover:shadow-[0_0_44px_rgba(99,102,241,.65)]",
    secondary:"shadow-[0_0_22px_rgba(148,163,184,.28)] hover:shadow-[0_0_34px_rgba(148,163,184,.45)]",
    violet:   "shadow-[0_0_30px_rgba(168,85,247,.40)] hover:shadow-[0_0_48px_rgba(217,70,239,.70)]",
  }[variant]

  // 押下リップル（globals.css の .ripple / .ripple-accent を利用）
  const onMouseDown: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const btn = e.currentTarget
    // ボタン内座標
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const span = document.createElement("span")
    span.className = "ripple ripple-accent"
    span.style.left = `${x}px`
    span.style.top = `${y}px`
    btn.appendChild(span)
    // アニメ完了で削除
    span.addEventListener("animationend", () => span.remove())
  }

  return (
    <button
      {...props}
      disabled={disabled}
      onMouseDown={disabled ? undefined : onMouseDown}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full font-semibold tracking-wide select-none",
        "transition will-change-transform active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "btn-pressable btn-ripple",              // ← globals.css の押下スタイルを活かす
        "text-white border border-white/10",
        `bg-gradient-to-r ${variantGrad}`,
        glowShadow,
        sizeCls,
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* グローのハロー（ぼかし） */}
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -z-10 inset-0 rounded-full blur-2xl opacity-60",
          variant === "primary"   && "bg-[radial-gradient(closest-side,rgba(99,102,241,.45),transparent_70%)]",
          variant === "secondary" && "bg-[radial-gradient(closest-side,rgba(148,163,184,.35),transparent_70%)]",
          variant === "violet"    && "bg-[radial-gradient(closest-side,rgba(217,70,239,.45),transparent_70%)]"
        )}
      />
      {children}
    </button>
  )
}
