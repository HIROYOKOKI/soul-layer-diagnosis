"use client"
import * as React from "react"
import clsx from "clsx"

type Variant = "primary" | "secondary"
type Size = "sm" | "md" | "lg"

export default function GlowButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}) {
  const base =
    "relative inline-flex items-center justify-center rounded-full font-semibold tracking-wide " +
    "transition will-change-transform select-none disabled:opacity-60 disabled:cursor-not-allowed " +
    "active:scale-[0.98] active:shadow-none"

  const sizeCls = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-7 py-4 text-lg",
  }[size]

  const variantCls = {
    primary:
      "text-white border border-white/10 " +
      "bg-gradient-to-r from-cyan-500 to-indigo-500 " +
      "shadow-[0_0_28px_rgba(56,189,248,0.28)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]",
    secondary:
      "text-white/90 border border-white/15 " +
      "bg-gradient-to-r from-slate-600 to-slate-700 " +
      "shadow-[0_0_20px_rgba(148,163,184,0.25)] hover:shadow-[0_0_30px_rgba(148,163,184,0.35)]",
  }[variant]

  return (
    <button className={clsx(base, sizeCls, variantCls, className)} {...props}>
      {children}
    </button>
  )
}
