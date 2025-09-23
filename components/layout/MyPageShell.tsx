// components/layout/MyPageShell.tsx
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
  // ← daily を拡張（UI表示要件：コメント/アドバイス/アファ/スコア）
  daily?: {
    code?: EV | null
    comment?: string | null
    advice?: string | null
    affirm?: string | null
    score?: number | null
    created_at?: string | null
  } | null
  // 任意：最新プロフィール（渡されなければカード非表示）
  profile?: {
    fortune?: string | null
    personality?: string | null
    partner?: string | null
    created_at?: string | null
  } | null
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
    const re = new RegExp(`^${model}(型)?（(.+?)）$`)
    const m = rawLabel.match(re)
    if (m) return m[2]
    const m2 = rawLabel.match(/（(.+?)）/)
    if (m2) return m2[1]
    if (rawLabel === 'EVΛƎ' || rawLabel === 'EΛVƎ') return fallback
    return rawLabel
  })()

  const modelColor = model === 'EVΛƎ' ? '#FF4500' : '#B833F5' // 指定色
  const themeName = (d?.theme?.name ?? 'LOVE').toString().toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== ヘッダー ===== */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <div className="text-[22px] md:text-3xl font-extrabold text-white tracking-wide">
            MY PAGE
          </div>
          <div
            className="font-extrabold tracking-wide"
            style={{ color: modelColor, fontSize: '14px' }}
          >
            {model}（{cleanedLabel}）
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-400">
          あなたの軌跡と、いまを映す
        </div>
      </div>

      {/* ===== プロフィール行 ===== */}
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
            <div className="text-xs text-neutral-400">ID: {idText}</div>
            <div className="text-lg md:text-xl font-semibold text-white truncate">{nameText}</div>
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

      {/* ===== テーマ ＋ 時刻 ===== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* ===== カードグリッド ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* デイリー（最新） */}
        <Card
          title="デイリー（最新）"
          right={
            d?.daily?.created_at ? (
              <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
                {formatJP(d.daily.created_at)}
              </span>
            ) : null
          }
        >
          {d?.daily?.code ? (
            <>
              <p className="text-sm text-neutral-200 leading-relaxed">
                <span className="text-white/60 mr-2">コメント</span>
                {d.daily?.comment ?? '—'}
              </p>
              <p className="mt-2 text-sm text-neutral-200 leading-relaxed">
                <span className="text-white/60 mr-2">アドバイス</span>
                {d.daily?.advice ?? '—'}
              </p>
              <p className="mt-2 text-sm text-neutral-200">
                <span className="text-white/60 mr-2">アファ</span>
                {d.daily?.affirm ?? '—'}
              </p>
              <div className="mt-3 text-sm text-white/80 flex items-center gap-2">
                <span className="text-white/60">スコア</span>
                <strong className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  {Number(d.daily?.score ?? 0).toFixed(1)}
                </strong>
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">まだデイリー診断がありません。</p>
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

        {/* 任意：プロフィール（最新）カード（データが来た時だけ表示） */}
        {d?.profile ? (
          <Card
            title="プロフィール（最新）"
            right={
              d.profile.created_at ? (
                <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
                  {formatJP(d.profile.created_at)}
                </span>
              ) : null
            }
          >
            <p className="text-sm text-neutral-200"><span className="text-white/60 mr-2">運勢</span>{d.profile.fortune ?? '—'}</p>
            <p className="mt-2 text-sm text-neutral-200"><span className="text-white/60 mr-2">性格</span>{d.profile.personality ?? '—'}</p>
            <p className="mt-2 text-sm text-neutral-200"><span className="text-white/60 mr-2">理想</span>{d.profile.partner ?? '—'}</p>
          </Card>
        ) : null}

        {children}
      </div>
    </div>
  )
}
