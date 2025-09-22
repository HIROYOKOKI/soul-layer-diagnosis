'use client'

import type { ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  // 見出し用（型とラベルのみ）
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

  // ===== 見出し（型名の重複除去＆色分け・50%縮小） =====
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'
  const fallback = model === 'EVΛƎ' ? '未来志向型' : '現実思考型'
  const rawLabel = (d?.quick?.label ?? fallback).trim()

  const cleanedLabel = (() => {
    // 例: "EVΛƎ（未来志向型）" / "EVΛƎ型（未来志向型）" → "未来志向型"
    const re = new RegExp(`^${model}(型)?（(.+?)）$`)
    const m = rawLabel.match(re)
    if (m) return m[2]
    const m2 = rawLabel.match(/（(.+?)）/)
    if (m2) return m2[1]
    if (rawLabel === 'EVΛƎ' || rawLabel === 'EΛVƎ') return fallback
    return rawLabel
  })()

  const modelColor = model === 'EVΛƎ' ? '#FF4500' : '#B833F5' // 指定色
  // テーマ（プロフィール直下）
  const themeName = (d?.theme?.name ?? 'LOVE').toString().toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== ヘッダー（左揃え：MY PAGE + 型名(小さく色付き) + サブコピー） ===== */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <div className="text-[22px] md:text-3xl font-extrabold text-white tracking-wide">
            MY PAGE
          </div>
          {/* 型名は従来見出しの約50%サイズ・色分け */}
          <div
            className="font-extrabold tracking-wide"
            style={{ color: modelColor, fontSize: '14px' }} // だいたい 50% 縮小
          >
            {model}（{cleanedLabel}）
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-400">
          あなたの軌跡と、いまを映す
        </div>
      </div>

      {/* ===== プロフィール行（設定ボタンは右端＝元位置） ===== */}
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
            {/* 指示：ID の下に名前 */}
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

      {/* ===== テーマ（プロフィールの下に戻す）＋ 日時（右端：元位置） ===== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* ===== カードグリッド（他は触らない） ===== */}
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
