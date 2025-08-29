'use client'

import clsx from 'clsx'

export type TypeKey = 'E' | 'V' | 'Λ' | 'Ǝ'

const COLOR_CLASSES: Record<TypeKey, { text: string; hoverText: string; hoverBg: string; shadow: string }> = {
  E: { text: 'text-[#f15a24]', hoverText: 'hover:text-[#f15a24]', hoverBg: 'hover:bg-[#f15a24]/20', shadow: 'hover:shadow-[0_0_12px_#f15a24]' },
  V: { text: 'text-[#44ffff]', hoverText: 'hover:text-[#44ffff]', hoverBg: 'hover:bg-[#44ffff]/20', shadow: 'hover:shadow-[0_0_12px_#44ffff]' },
  Λ: { text: 'text-[#fcee21]', hoverText: 'hover:text-[#fcee21]', hoverBg: 'hover:bg-[#fcee21]/20', shadow: 'hover:shadow-[0_0_12px_#fcee21]' },
  Ǝ: { text: 'text-[#812b8c]', hoverText: 'hover:text-[#812b8c]', hoverBg: 'hover:bg-[#812b8c]/20', shadow: 'hover:shadow-[0_0_12px_#812b8c]' },
}

export function HistoryIcon({ type, className }: { type: TypeKey; className?: string }) {
  const c = COLOR_CLASSES[type]
  return (
    <div
      aria-label={`構造 ${type}`}
      className={clsx(
        'w-10 h-10 flex items-center justify-center rounded-md bg-surface transition duration-300',
        c.text, c.hoverText, c.hoverBg, c.shadow, className
      )}
    >
      {type}
    </div>
  )
}
