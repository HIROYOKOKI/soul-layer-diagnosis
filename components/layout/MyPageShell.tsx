// components/layout/MyPageShell.tsx
'use client'

import type { ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  // 見出しは Quick の model/label だけ使う（並びは表示しない方針）
  quick?: { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: { code?: EV | null; comment?: string | null; created_at?: string | null } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

/* ===== 共通カード ===== */
export function Card({
  title, children, right,
}: { title: string; children: ReactNode; right?: ReactNode }) {
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

export type MyPageShellProps = { data?: MyPageData | null; children?: ReactNode }

/* ===== 本体レイアウト ===== */
export default function MyPageShell({ data, children }: MyPageShellProps) {
  const d = (data ?? EMPTY_DATA) as MyPageData

  const name = d?.user?.name ?? 'Hiro'
  const did = d?.user?.displayId ?? '0001'
  const avatar = d?.user?.avatarUrl ?? ''

  // Quick 見出し（型と色）
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'
  const modelLabel = d?.quick?.label ?? (model === 'EVΛƎ' ? '未来志向型' : '現実思考型')
  const modelColor = model === 'EVΛƎ' ? '#FF4500' : '#B833F5' // EVΛƎ=オレンジ / EΛVƎ=パープル

  // テーマ表記（lowercase表示＋更新日）
  const themeRaw = (d?.theme?.name ?? 'LIFE') as string
  const themeName = themeRaw.toLowerCase()
  const themeUpdated = d?.theme?.updated_at ? formatJP(d.theme.updated_at) : ''

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== ヘッダー（画像の構成に合わせる） ===== */}
      <div className="mb-3 flex items-start justify-between">
        {/* 左：MY PAGE と 型名（50%縮小・色分け）＋サブコピー */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <div className="text-[22px] md:text-3xl font-extrabold text-white tracking-wide">
              MY PAGE
            </div>
            <div
              className="font-extrabold tracking-wide"
              // 以前の見出しの約 50% に縮小
              style={{ color: modelColor, fontSize: '14px' /* ~50% */ }}
            >
              {model}（{modelLabel}）
            </div>
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            あなたの軌跡と、いまを映す
          </div>
        </div>

        {/* 右：設定ボタン（ピル形） */}
        <button
          type="button"
          aria-label="設定"
          className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
        >
          設定
        </button>
      </div>

      {/* サブ行：テーマ（左）と 現在時刻（右） */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xs text-neutral-400">
          テーマ：{themeName}{themeUpdated ? ` ・ ${themeUpdated}` : ''}
        </div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* ===== プロフィール行 ===== */}
      <div className="mb-2 flex items-center justify-between rounded-none border-0 bg-transparent p-0 shadow-none">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-neutral-500 text-6xl leading-none">🙂</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg md:text-xl font-semibold text-white truncate">{name}</div>
            <div className="text-xs text-neutral-400">ID: {did}</div>
          </div>
        </div>
      </div>

      {/* ===== カードグリッド ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <button
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600"
              disabled
            >
              診断タイプを選ぶ
              <div className="text-xs text-neutral-400">Weekly / Monthly (予定)</div>
            </button>
          </div>
        </Card>

        {children}
      </div>
    </div>
  )
}
