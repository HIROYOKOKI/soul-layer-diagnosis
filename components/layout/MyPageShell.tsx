'use client'

import type { ReactNode } from 'react'
import ThemeRow from './ThemeRow'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  quick?: { order?: EV[]; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: { code?: EV | null; comment?: string | null; created_at?: string | null } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

export function Card({
  title,
  children,
  right,
}: {
  title: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="rounded-2xl shadow-sm border border-white/10 bg-black/90 backdrop-blur p-5 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-white tracking-wide">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

export function formatJP(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

export type MyPageShellProps = {
  data?: MyPageData | null
  children?: ReactNode
}

export default function MyPageShell({ data, children }: MyPageShellProps) {
  const d = (data ?? EMPTY_DATA) as MyPageData
  const name = d?.user?.name ?? 'Hiro'
  const did = d?.user?.displayId ?? '0001'
  const avatar = d?.user?.avatarUrl ?? ''

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* 中央タイトル（固定） */}
      <div className="mb-5 md:mb-6 flex justify-center">
        <span className="text-[22px] md:text-3xl font-extrabold text-purple-400 tracking-wide">
          EVΛƎ（未来志向型）
        </span>
      </div>

      {/* プロフィール行（カード外）＋ 右端⚙️ */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-neutral-500 text-xl">🙂</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg md:text-xl font-semibold text-white truncate">{name}</div>
            <div className="text-xs text-neutral-400">ID: {did}</div>
          </div>
        </div>
        <button
          type="button"
          aria-label="設定"
          className="text-xl text-neutral-300 hover:text-white transition-colors"
        >
          ⚙️
        </button>
      </div>

      {/* テーマ行（ヘッダ直下・左端揃え） */}
      <div className="mt-2 mb-6">
        <ThemeRow
          label="テーマ"
          value={d?.theme?.name ?? 'LOVE'}
          date={d?.theme?.updated_at ?? '2025-09-07T23:34:00'}
        />
      </div>

      {/* カードグリッド（プロフィール枠は含めない） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick（条件付き） */}
        {d?.quick?.order?.length ? (
          <Card title="Quick 結果">
            <div className="text-white text-sm tracking-wide">{d.quick.order.join(' ')}</div>
            <div className="mt-3 text-xs text-neutral-400">
              {d.quick.created_at ? `更新: ${formatJP(d.quick.created_at)}` : ''}
            </div>
          </Card>
        ) : null}

        {/* デイリー（最新） */}
        <Card title="デイリー（最新）">
          {d?.daily?.code ? (
            <>
              <p className="text-sm text-neutral-200 leading-relaxed">
                {d.daily.comment ?? 'コメントはまだありません。'}
              </p>
              <div className="mt-3 text-xs text-neutral-400">更新: {formatJP(d.daily.created_at)}</div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">未取得</p>
          )}
        </Card>

        {/* 構造バランス（レーダー枠） */}
        <Card title="構造バランス">
          <div className="h-48 flex items-center justify-center text-neutral-500">
            [Radar Chart Placeholder]
          </div>
        </Card>

        {/* 次の一歩 */}
        <Card title="次の一歩を選んでください">
          <div className="flex gap-4">
            <button className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600">
              デイリー診断
              <div className="text-xs text-neutral-400">1問 / 今日のゆらぎ</div>
            </button>
            <button className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600">
              診断タイプを選ぶ
              <div className="text-xs text-neutral-400">Weekly / Monthly (予定)</div>
            </button>
          </div>
        </Card>

        {/* ページ固有の差し込み */}
        {children}
      </div>
    </div>
  )
}
