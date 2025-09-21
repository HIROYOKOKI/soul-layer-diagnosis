'use client'

import type { ReactNode } from 'react'
import ThemeRow from './ThemeRow'
import { formatJP } from './date'
import Link from 'next/link'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  quick?: { order?: EV[] | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: { code?: EV | null; comment?: string | null; created_at?: string | null } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

/* ====== 共通カード ====== */
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

export type MyPageShellProps = {
  data?: MyPageData | null
  children?: ReactNode
}

/* ====== 本体レイアウト ====== */
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

      {/* プロフィール行 */}
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

      {/* テーマ行 */}
      <div className="mt-2 mb-6">
        <ThemeRow
          label="テーマ"
          value={d?.theme?.name ?? 'LOVE'}
          date={d?.theme?.updated_at ?? ''}
        />
      </div>

      {/* カードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick（条件付き表示） */}
        {Array.isArray(d?.quick?.order) && d.quick?.order?.length > 0 ? (
          <Card title="Quick 結果">
            <div className="text-white text-sm tracking-wide">
              {d.quick?.order?.join(' ')}
            </div>
            <div className="mt-3 text-xs text-neutral-400">
              {d.quick?.created_at ? `更新: ${formatJP(d.quick.created_at)}` : ''}
            </div>
          </Card>
        ) : null}

        {/* デイリー（最新） */}
        <Card title="デイリー（最新）">
          {d?.daily?.code ? (
            <>
              <p className="text-sm text-neutral-200 leading-relaxed">
                {d.daily?.comment ?? 'コメントはまだありません。'}
              </p>
              <div className="mt-3 text-xs text-neutral-400">
                {d.daily?.created_at ? `更新: ${formatJP(d.daily.created_at)}` : ''}
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">未取得</p>
          )}
        </Card>

        {/* 構造バランス */}
        <Card title="構造バランス">
          <div className="h-48 flex items-center justify-center text-neutral-500">
            [Radar Chart Placeholder]
          </div>
        </Card>

        {/* 次の一歩 */}
        <Card title="次の一歩を選んでください">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/daily" className="rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600 px-4 py-3 text-center hover:bg-neutral-700">
              デイリー診断
              <div className="text-xs text-neutral-400">1問 / 今日のゆらぎ</div>
            </Link>
            <Link href="/theme" className="rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600 px-4 py-3 text-center hover:bg-neutral-700">
              テーマ設定
              <div className="text-xs text-neutral-400">WORK/LOVE/FUTURE/LIFE</div>
            </Link>
            <Link href="/quick" className="rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600 px-4 py-3 text-center hover:bg-neutral-700">
              Quick診断
              <div className="text-xs text-neutral-400">近日拡張</div>
            </Link>
            <Link href="/log" className="rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600 px-4 py-3 text-center hover:bg-neutral-700">
              診断ログ
              <div className="text-xs text-neutral-400">最新2種を表示</div>
            </Link>
          </div>
        </Card>

        {/* ページ固有の差し込み */}
        {children}
      </div>
    </div>
  )
}
