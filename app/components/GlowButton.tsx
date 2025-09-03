// components/GlowButton.tsx
"use client"
import React from "react"

export default function GlowButton(
  { children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-full text-white " +
        "bg-gradient-to-r from-cyan-500 to-indigo-500 " +
        "shadow-[0_0_28px_rgba(56,189,248,0.28)] " +
        "active:scale-[0.98] " +
        (props.className || "")
      }
    >
      {children}
    </button>
  )
}
