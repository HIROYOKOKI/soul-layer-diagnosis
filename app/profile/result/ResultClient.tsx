'use client'

import { useEffect, useState } from 'react'
import LuneaResult from './LuneaResult'
import Link from 'next/link'

type Line = { type: string; label: string; text: string }

export default function ResultClient() {
  const [lines, setLines] = useState<Line[] | null>(null)

  useEffect(() => {
    try {
      // フォーム送信後に保存した結果を拾う
      const raw = sessionStorage.getItem('lunea_lines')
      if (raw) setLines(JSON.parse(raw) as Line[])
    } catch {
      // 何もしない（安全に無視）
    }
  }, [])

  if (!lines || lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="opacity-70 mb-4">表示できる診断結果が見つかりませんでした。</p>
        <div className="flex gap-2">
          <Link href="/profile" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">プロフィールへ</Link>
          <Link href="/mypage" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">マイページへ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <LuneaResult lines={lines} />
    </div>
  )
}
