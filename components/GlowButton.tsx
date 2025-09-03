"use client"
import React from "react"
export default function GlowButton(
  { children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={"px-4 py-2 rounded-full text-white bg-gradient-to-r from-cyan-500 to-indigo-500 active:scale-[0.98] " + className}
    >
      {children}
    </button>
  )
}
