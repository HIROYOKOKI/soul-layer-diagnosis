// components/ui/CardHeader.tsx
"use client"

import { Settings } from "lucide-react"

type Props = {
  title: string
  onSettings?: () => void
  rightNode?: React.ReactNode  // FREEピルなど
}

export default function CardHeader({ title, onSettings, rightNode }: Props) {
  return (
    <div className="flex items-center justify-between mb-2">
      {/* 左: タイトル */}
      <h3 className="text-sm font-medium text-white/80">{title}</h3>

      {/* 右: ピル or 歯車 */}
      <div className="flex items-center gap-2">
        {rightNode}
        <button
          type="button"
          aria-label="カード設定"
          onClick={onSettings}
          className="h-8 w-8 rounded-full grid place-items-center
                     bg-white/8 hover:bg-white/12 transition
                     ring-1 ring-white/10"
        >
          <Settings className="h-5 w-5 text-sky-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
