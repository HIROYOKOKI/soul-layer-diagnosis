'use client'

import { formatJP } from './MyPageShell'

export default function ThemeRow({
  label = 'テーマ',
  value = '',
  date,
}: {
  label?: string
  value?: string
  date?: string
}) {
  return (
    <div className="text-sm text-neutral-300">
      {label}: <span className="text-purple-400 font-bold ml-1">{value}</span>
      {date ? <span className="ml-2">{formatJP(date)}</span> : null}
    </div>
  )
}
