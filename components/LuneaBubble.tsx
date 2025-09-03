// components/LuneaBubble.tsx
"use client"
import React from "react"

export default function LuneaBubble({ text, speed = 18 }: { text: string; speed?: number }) {
  const [out, setOut] = React.useState("")
  React.useEffect(() => {
    setOut("")
    let i = 0
    const id = setInterval(() => {
      i++; setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return (
    <div className="max-w-2xl w-full rounded-2xl border border-white/10 bg-white/5 p-4 leading-relaxed">
      <div className="font-medium">{out || "…"}</div>
    </div>
  )
}
