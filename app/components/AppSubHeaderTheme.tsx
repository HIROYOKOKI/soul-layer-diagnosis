// app/components/AppSubHeaderTheme.tsx
'use client'

import { useEffect, useState } from 'react'

type ThemeGetResponse = { theme: string | null }  // /api/theme/get の返り値を想定

export default function AppSubHeaderTheme() {
  const [theme, setTheme] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch('/api/theme/get', { method: 'GET' })
        if (res.ok) {
          const data: ThemeGetResponse = await res.json()
          if (!aborted) setTheme(data?.theme ?? null)
        } else {
          if (!aborted) setTheme(null)
        }
      } catch {
        if (!aborted) setTheme(null)
      } finally {
        if (!aborted) setLoaded(true)
      }
    })()
    return () => { aborted = true }
  }, [])

  // 読み込み中はちらつきを避けて非表示
  if (!loaded) return null

  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="mx-auto w-full max-w-screen-sm px-4 h-9 flex items-center justify-between text-xs text-white/80">
        <span>現在のテーマ：{theme ?? '未選択'}</span>
        <a href="/theme" className="underline opacity-75 hover:opacity-95">変更する</a>
      </div>
    </div>
  )
}
