// components/layout/MyPageShell.tsx
'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { formatJP } from './date'
import ClockJST from './ClockJST'
import RadarMini from '@/app/mypage/RadarMini' // ★ 追加：軽量レーダー

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

/* ====== 型 ====== */
export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null; id?: string | null } | null
  quick?: { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: {
    id?: string | null
    code?: EV | null
    comment?: string | null
    advice?: string | null
    affirm?: string | null
    /** 互換用：APIが affirmation で返す場合も拾う */
    affirmation?: string | null
    /** 互換用：名言等をアファメーション代替にしている場合 */
    quote?: string | null
    /** JST当日判定が API 側で渡ってくる場合 */
    is_today_jst?: boolean | null
    /** 補足 */
    score?: number | null
    created_at?: string | null
    slot?: string | null
    theme?: string | null
    nextv?: { id: string; label: string }[] | null
    nextv_selected?: string | null

    /** ▼ レーダー用に将来拡張されるかもしれない形（存在すれば拾う） */
    // 例: { E:70, V:55, L:40, Ze:65 }
    scores?: Partial<Record<'E' | 'V' | 'L' | 'Ze', number>>
    // 例: { E:0.7, V:0.55, Λ:0.4, Ǝ:0.65 }
    score_map?: Partial<Record<'E' | 'V' | 'Λ' | 'Ǝ', number>>
  } | null
  profile?: {
    fortune?: string | null
    personality?: string | null
    partner?: string | null
    created_at?: string | null
  } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

/* ===== ユーティリティ ===== */
const toJstDateString = (d: string | Date) =>
  new Date(new Date(d).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })).toDateString()

/** Daily表示用テキストの決定（空文字は除外して trim） */
function pickDailyText(daily?: MyPageData['daily'] | null): string {
  if (!daily) return ''
  const t =
    daily.affirm?.trim() ??
    daily.affirmation?.trim() ??
    daily.quote?.trim() ??
    daily.advice?.trim() ??
    daily.comment?.trim() ??
    ''
  return t
}

/** JSTの今日判定（APIから is_today_jst が来ればそれを優先） */
function isTodayJST(daily?: MyPageData['daily'] | null): boolean {
  if (!daily) return false
  if (typeof daily.is_today_jst === 'boolean') return daily.is_today_jst
  if (!daily.created_at) return true // created_at 無い時は寛容に表示
  return toJstDateString(daily.created_at) === toJstDateString(new Date())
}

/** ▼ レーダー用スコアの抽出（存在しない場合は見栄えの良い安全なデフォルト） */
function pickRadarScores(d?: MyPageData | null) {
  const daily = d?.daily
  // 1) daily.scores: {E,V,L,Ze}
  const s1 = daily?.scores
  if (s1 && typeof s1.E === 'number' && typeof s1.V === 'number' && typeof s1.L === 'number' && typeof s1.Ze === 'number') {
    return { E: clamp100(s1.E), V: clamp100(s1.V), L: clamp100(s1.L), Ze: clamp100(s1.Ze) }
  }
  // 2) daily.score_map: {E,V,Λ,Ǝ}（0–1 または 0–100 想定）
  const m = daily?.score_map
  if (m) {
    const to100 = (v?: number) => (typeof v === 'number' ? (v <= 1 ? v * 100 : v) : undefined)
    const E = to100(m.E)
    const V = to100(m.V)
    const L = to100((m as any)['Λ'])
    const Ze = to100((m as any)['Ǝ'])
    if ([E, V, L, Ze].every(v => typeof v === 'number')) {
      return { E: clamp100(E as number), V: clamp100(V as number), L: clamp100(L as number), Ze: clamp100(Ze as number) }
    }
  }
  // 3) 何もなければデフォルト（見栄え用）
  return { E: 68, V: 58, L: 46, Ze: 72 }
}
function clamp100(n: number) { return Math.max(0, Math.min(100, n)) }

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

export type MyPageShellProps = {
  data?: MyPageData | null
  children?: ReactNode
  userId?: string | null
}

/* ===== 本体レイアウト ===== */
export default function MyPageShell({ data, children, userId }: MyPageShellProps) {
  const d = (data ?? EMPTY_DATA) as MyPageData

  const avatar = d?.user?.avatarUrl ?? ''
  const idText = d?.user?.displayId ?? '0001'
  const nameText = d?.user?.name ?? 'Hiro'
  const uid = userId ?? d?.user?.id ?? null

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
  const modelColor = model === 'EVΛƎ' ? '#FF4500' : '#B833F5'
  const themeName = (d?.theme?.name ?? 'LOVE').toString().toUpperCase()

  const [openDaily, setOpenDaily] = useState(false)
  const [selectedNextV, setSelectedNextV] = useState<string | null>(d?.daily?.nextv_selected ?? null)
  const nextVList = d?.daily?.nextv ?? null

  async function saveNextV(nextvId: string, nextvLabel: string) {
    if (selectedNextV || !uid || !d?.daily?.id) return
    try {
      const res = await fetch('/api/daily/nextv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, daily_id: d.daily.id, nextv_id: nextvId, nextv_label: nextvLabel }),
      })
      const j = await res.json()
      if (j?.ok) {
        setSelectedNextV(nextvId)
        alert(`「${nextvLabel}」を記録しました`)
      } else {
        alert('保存失敗: ' + (j?.error ?? 'unknown'))
      }
    } catch {
      alert('保存に失敗しました')
    }
  }

  /* ====== 表示用決定 ====== */
  const dailyText = pickDailyText(d?.daily)
  const showDaily = Boolean(dailyText) && isTodayJST(d?.daily)

  // ▼ レーダー用スコア（存在すればそれを、無ければデフォルト）
  const radar = pickRadarScores(d)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== ヘッダー ===== */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <div className="text-[22px] md:text-3xl font-extrabold text-white tracking-wide">MY PAGE</div>
          <div className="font-extrabold tracking-wide" style={{ color: modelColor, fontSize: '14px' }}>
            {model}（{cleanedLabel}）
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-400">あなたの軌跡と、いまを映す</div>
      </div>

      {/* ===== プロフィール行 ===== */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-neutral-500 text-6xl leading-none">👤</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-400">ID: {idText}</div>
            <div className="text-lg md:text-xl font-semibold text-white truncate">{nameText}</div>
          </div>
        </div>

        <button type="button" aria-label="設定" className="text-xl text-neutral-300 hover:text-white transition-colors">
          ⚙️
        </button>
      </div>

      {/* ===== テーマ ＋ 時計 ===== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* ===== カードグリッド ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 今日のアファ（ボタン → モーダル） */}
        <Card
          title="今日のアファメーション"
          right={
            d?.daily?.created_at ? (
              <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
                {formatJP(d.daily.created_at)}
              </span>
            ) : null
          }
        >
          {showDaily ? (
            <button
              onClick={() => setOpenDaily(true)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition"
            >
              {dailyText}
            </button>
          ) : (
            <p className="text-xs text-neutral-500">まだ診断がありません。</p>
          )}
        </Card>

        {/* 構造バランス（★ レーダー差し替え） */}
        <Card title="構造バランス">
          <div className="mt-1">
            <RadarMini scores={radar} size={320} />
            <p className="mt-2 text-xs text-white/60">
              最新の診断から可視化（0〜100で相対表示。0〜1形式も自動変換）。
            </p>
          </div>
        </Card>

        {/* 次の一歩 */}
        <Card title="次の一歩を選んでください">
          <div className="flex gap-4">
            {/* 確実に遷移するよう Link */}
            <Link
              href="/daily"
              className="flex-1 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3
                         text-white text-sm font-medium hover:bg-neutral-700 transition
                         outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <div>デイリー診断</div>
              <div className="text-xs text-neutral-400">1問 / 今日のゆらぎ</div>
            </Link>

            <button
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600"
              disabled
            >
              診断タイプを選ぶ
              <div className="text-xs text-neutral-400">Weekly / Monthly (予定)</div>
            </button>
          </div>
        </Card>

        {/* プロフィール（任意） */}
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

      {/* ===== モーダル（デイリー詳細） ===== */}
      {openDaily && d?.daily && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setOpenDaily(false)}
        >
          <div
            className="bg-black rounded-2xl p-6 max-w-md w-full border border-white/10 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold">今日の診断詳細</h2>
              <button
                aria-label="閉じる"
                className="text-white/70 hover:text-white"
                onClick={() => setOpenDaily(false)}
              >
                ✖️
              </button>
            </div>

            {/* 詳細は元レコードをそのまま見せる */}
            {d.daily.comment && (
              <p className="text-sm text-white/90 mb-3">
                <span className="text-white/60">コメント：</span>{d.daily.comment}
              </p>
            )}
            {d.daily.advice && (
              <p className="text-sm text-white/90 mb-3">
                <span className="text-white/60">アドバイス：</span>{d.daily.advice}
              </p>
            )}
            {typeof d.daily.score === 'number' && (
              <p className="text-sm text-white/90">
                <span className="text-white/60">スコア：</span>{Number(d.daily.score ?? 0).toFixed(1)}
              </p>
            )}

            {nextVList && nextVList.length > 0 && (
              <div className="mt-4">
                <p className="text-white/70 mb-2">次の一手を選ぶ</p>
                <ul className="space-y-2">
                  {nextVList.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => { if (!selectedNextV) saveNextV(n.id, n.label) }}
                        disabled={!!selectedNextV}
                        className={`w-full px-3 py-2 rounded-lg border text-sm transition
                          ${selectedNextV === n.id
                              ? 'bg-green-800 border-green-500 text-white cursor-default'
                              : 'bg-neutral-800 border-white/10 text-white/90 hover:bg-neutral-700'}`}
                      >
                        {n.label} {selectedNextV === n.id ? '✓' : ''}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-white/50">※ 選択はその日のみ有効。翌日になるとリセットされます。</p>
              </div>
            )}

            <button onClick={() => setOpenDaily(false)} className="mt-5 w-full px-4 py-2 bg-neutral-700 text-white rounded-lg">
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
