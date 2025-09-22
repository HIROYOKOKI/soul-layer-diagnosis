// components/layout/MyPageShell.tsx
'use client'

import type { ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  // 見出しに使う型のみ（並びは /mypage では非表示）
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

  const avatar = d?.user?.avatarUrl ?? ''
  const idText = d?.user?.displayId ?? '0001'
  const nameText = d?.user?.name ?? 'Hiro'

  // ===== 見出し（Quick の型を中央に1回だけ表示） =====
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'

  // APIの label が「EVΛƎ型（未来志向型）」のように model を含む場合があるため整形
  const rawLabel = d?.quick?.label ?? (model === 'EVΛƎ' ? '未来志向型' : '現実思考型')
  const cleanedLabel = (() => {
    // 先頭に「EVΛƎ型」や「EΛVƎ型」が付いていたら除去
    const r = rawLabel.replace(/^E[VΛƎ]+型（?/, '').replace(/）?$/, '')
    return r || (model === 'EVΛƎ' ? '未来志向型' : '現実思考型')
  })()

  // ※色は既定のまま（レイアウトのみ調整）。必要なら model で色分岐可。

  // テーマ表記（プロフィール直下へ戻す）
  const themeName = (d?.theme?.name ?? 'LOVE').toString().toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== タイトル：左右中央 ===== */}
      <div className="mb-3 flex justify-center">
        <span className="text-xl md:text-2xl font-extrabold tracking-wide text-purple-400">
          {model}（{cleanedLabel}）
        </span>
      </div>

      {/* ===== プロフィール行（設定ボタンは右端：元の位置） ===== */}
      <div className="mb-1 flex items-center justify-between rounded-none border-0 bg-transparent p-0 shadow-none">
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
            {/* 指定：ID の下に名前を表示 */}
            <div className="text-xs text-neutral-400">ID: {idText}</div>
            <div className="text-lg md:text-xl font-semibold text-white truncate">{nameText}</div>
          </div>
        </div>

        {/* 設定ボタン（元の位置） */}
        <button
          type="button"
          aria-label="設定"
          className="text-xl text-neutral-300 hover:text-white transition-colors"
        >
          ⚙️
        </button>
      </div>

      {/* ===== テーマ行（プロフィールの下に戻す）＋ 日時は右端（元の位置） ===== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
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
