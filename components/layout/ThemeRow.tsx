'use client'
import { formatJP } from './date'   // ← MyPageShell からの import をやめる

const LABEL: Record<string, string> = {
  WORK: 'WORK',
  LOVE: 'LOVE',
  FUTURE: 'FUTURE',
  LIFE: 'LIFE',
}

export default function ThemeRow({
  label = 'テーマ',
  value = '',
  date,
}: { label?: string; value?: string; date?: string }) {
  const key = (value || '').toUpperCase()
  const shown = LABEL[key] || key || '—'
  return (
    <div className="text-sm text-neutral-300">
      {label}: <span className="text-purple-400 font-bold ml-1">{shown}</span>
      {date ? <span className="ml-2">{formatJP(date)}</span> : null}
    </div>
  )
}
