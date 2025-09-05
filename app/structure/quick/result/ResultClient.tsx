'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

// Quick v2 payload（Confirmで保存したものを読む）
type PendingV2 = {
  order: EV[]
  labels: Record<EV, string>// app/structure/quick/QuickClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

type PendingV2 = {
  order: EV[]                               // 押した順（第1位→第4位）
  labels: Record<EV, string>                // 各コードの表示ラベル
  points: Record<EV, number>                // 1位=4, 2位=3, 3位=2, 4位=1
  baseHints: Record<EV, { type: string; comment: string }>
  _meta: {
    ts: number
    v: 'quick-v2'
    presentModel: 'EΛVƎ'                    // 確定した現在=顕在
    futureModel: 'EVΛƎ'                     // 未確定の未来=潜在
    question: string
  }
}

// 固定出題（ベース診断）
const QUESTION =
  'Q. あなたが人生で最も大切にしたいものはどれですか？（選んだ順に順位付けしてください）'

// 固定4択（E/V/Λ/Ǝ対応）
const CHOICES: Array<{ code: EV; label: string; desc: string }> = [
  { code: 'E', label: 'E（衝動・情熱）', desc: 'やりたいことを迷わず行動に移す力' },
  { code: 'V', label: 'V（可能性・夢）', desc: 'まだ見ぬ未来や夢を追いかける心' },
  { code: 'Λ', label: 'Λ（選択・葛藤）', desc: '悩みながらも自分で選び取る自由' },
  { code: 'Ǝ', label: 'Ǝ（観測・静寂）', desc: 'ものごとを見つめ、意味を感じ取る時間' },
]

// ベースヒント（結果ページ側の補助テキストに使用）
const BASE_HINTS: PendingV2['baseHints'] = {
  E: { type: 'E主導', comment: '衝動と行動で学びを回収する傾向。まず動いて掴むタイプ。' },
  V: { type: 'V主導', comment: '可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。' },
  Λ: { type: 'Λ主導', comment: '選択基準を定め最短距離を選ぶ傾向。設計と取捨選択が得意。' },
  Ǝ: { type: 'Ǝ主導', comment: '観測→小実験→選び直しの循環。状況把握が得意。' },
}

export default function QuickClient() {
  const router = useRouter()
  const [order, setOrder] = useState<EV[]>([])   // 押した順
  const [locking, setLocking] = useState(false)  // 送信中

  const chosen = useMemo(() => new Set(order), [order])
  const isDone = order.length === CHOICES.length

  function handlePick(code: EV) {
    if (locking || chosen.has(code)) return
    setOrder((prev) => [...prev, code])
  }

  function undoLast() {
    if (locking || order.length === 0) return
    setOrder((prev) => prev.slice(0, -1))
  }

  function resetAll() {
    if (locking || order.length === 0) return
    setOrder([])
  }

  function computePoints(ord: EV[]): Record<EV, number> {
    // 1位=4, 2位=3, 3位=2, 4位=1
    const pts: Record<EV, number> = { E: 0, V: 0, Λ: 0, Ǝ: 0 }
    ord.forEach((code, idx) => { pts[code] = 4 - idx })
    return pts
  }

  function toConfirm() {
    if (!isDone || locking) return
    setLocking(true)

    const labels = CHOICES.reduce((acc, c) => {
      acc[c.code] = c.label
      return acc
    }, {} as Record<EV, string>)

    const payload: PendingV2 = {
      order,
      labels,
      points: computePoints(order),
      baseHints: BASE_HINTS,
      _meta: {
        ts: Date.now(),
        v: 'quick-v2',
        presentModel: 'EΛVƎ',
        futureModel: 'EVΛƎ',
        question: QUESTION,
      },
    }

    sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload))
    router.push('/structure/quick/confirm')
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image
          src="/evae-logo.svg"
          alt="EVΛƎ"
          width={96}
          height={32}
          priority
          className="h-8 w-auto"
        />
      </header>

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          {/* タイトル */}
          <h2 className="text-center text-lg font-bold mb-2">
            クイック判定（1問・順位付け）
          </h2>

          {/* 出題 */}
          <p className="text-sm text-white/80 mb-5 text-center leading-relaxed">
            {QUESTION}
          </p>
          <div className="h-px bg-white/10 mb-5" />

          {/* 選択肢（押した順で順位表示） */}
          <div className="grid gap-3">
            {CHOICES.map((c) => {
              const rank = order.indexOf(c.code) // -1:未選択
              const picked = rank >= 0
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c.code)}
                  disabled={picked || locking}
                  className={`group w-full text-left rounded-2xl border px-4 py-4 transition
                    ${picked
                      ? 'bg-blue-600/80 border-white/20 text-white'
                      : 'bg-white/5 border-white/12 hover:bg-white/8 hover:border-white/20'
                    } active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full
                                     border border-white/25 text-xs text-white/80 px-2 py-0.5">
                      {picked ? `第${rank + 1}位` : '未選択'}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-xs opacity-80 mt-0.5">{c.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 操作 */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={undoLast}
              disabled={order.length === 0 || locking}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              ひとつ戻す
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={order.length === 0 || locking}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              リセット
            </button>
          </div>

          {/* 確認ブロック */}
          <div className="mt-6">
            <h3 className="text-sm font-bold mb-2">現在の順位</h3>
            <ol className="list-decimal list-inside text-left text-sm space-y-1">
              {order.map((code, i) => {
                const item = CHOICES.find((x) => x.code === code)!
                return <li key={code}>{i + 1}位：{item.label}</li>
              })}
            </ol>

            <button
              type="button"
              onClick={toConfirm}
              disabled={!isDone || locking}
              className="mt-4 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500 disabled:opacity-40"
            >
              この内容で確認へ
            </button>

            {locking && (
              <p className="mt-3 text-center text-xs text-white/60">
                次の画面へ移動中…
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}

  points: Record<EV, number>
  baseHints: Record<EV, { type: string; comment: string }>
  _meta: {
    ts: number
    v: 'quick-v2'
    presentModel: 'EΛVƎ' // 確定した現在=顕在
    futureModel: 'EVΛƎ'  // 未確定の未来=潜在
    question: string
  }
}

// プロフィール診断結果（既存の構造を想定：最低限の項目だけ利用）
type ProfileResultLike = {
  fortune?: string
  personality?: string
  partner?: string
  work?: string
  luneaLines?: string[] // ルネアのセリフ段階表示を想定
}

export default function ResultClient() {
  const router = useRouter()
  const [quick, setQuick] = useState<PendingV2 | null>(null)
  const [profile, setProfile] = useState<ProfileResultLike | null>(null)

  // --- 初期ロード ---
  useEffect(() => {
    // 1) クイック診断データ
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) {
        const parsed = JSON.parse(raw) as PendingV2
        if (parsed?.order?.length === 4) setQuick(parsed)
      }
    } catch {}

    // 2) プロフィール結果（あれば同画面で統合表示）
    //   ※ 実装によりキー名が異なる場合があるので、存在チェックを広めに
    const candidateKeys = [
      'profile_diagnose_result', // 仮：/profile/result 側で保存しているケース
      'profile_last_result',     // 仮：別名保存ケース
    ]
    for (const k of candidateKeys) {
      try {
        const raw = sessionStorage.getItem(k)
        if (raw) {
          const parsed = JSON.parse(raw) as ProfileResultLike
          if (parsed && (parsed.fortune || parsed.personality || parsed.partner || parsed.work || parsed.luneaLines)) {
            setProfile(parsed)
            break
          }
        }
      } catch {}
    }
  }, [])

  const ranks = useMemo(() => {
    if (!quick) return []
    return quick.order.map((code, i) => ({
      idx: i + 1,
      code,
      label: quick.labels[code],
      point: quick.points[code],
      hint: quick.baseHints[code],
    }))
  }, [quick])

  const isReady = !!quick

  function goQuickTop() {
    router.push('/structure/quick')
  }

  function goMyPage() {
    router.push('/mypage')
  }

  function goProfileResult() {
    router.push('/profile/result')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* ルネアのひと言（簡易） */}
        <div className="rounded-2xl border border-white/12 bg-white/5 p-4 mb-6">
          <p className="text-sm leading-relaxed">
            …観測が終わったよ。これは、きみの<strong className="font-semibold">“基礎層”</strong>——
            そして“魂のプロフィール”の入り口だよ。
          </p>
        </div>

        {/* 基礎層（クイック診断） */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2">基礎層（クイック診断の順位）</h2>

          {!isReady ? (
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <p className="text-sm text-white/70">
                クイック診断の一時データが見つかりませんでした。
              </p>
              <button
                onClick={goQuickTop}
                className="mt-4 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
              >
                クイック診断に戻る
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <p className="text-xs text-white/60 mb-3">{quick?._meta.question}</p>

              <ol className="list-decimal list-inside space-y-2 text-sm">
                {ranks.map((r) => (
                  <li key={r.code} className="flex items-start gap-2">
                    <span className="inline-flex shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px] text-white/80">
                      第{r.idx}位
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-white/70 mt-0.5">
                        {r.hint?.type}／{r.hint?.comment}（{r.point}点）
                      </div>
                    </div>
                    <span className="text-[11px] opacity-70">{r.code}</span>
                  </li>
                ))}
              </ol>

              {/* 将来：ここでサーバAPIに保存する（profile_results など）
                  - /api/profile/save（任意）実装後にPOSTする */}
            </div>
          )}
        </section>

        {/* プロフィール診断（統合表示 or フォールバック） */}
        <section>
          <h2 className="text-lg font-bold mb-2">プロフィール診断</h2>

          {profile ? (
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4 space-y-3">
              {/* ルネアの段階セリフがあれば先頭に */}
              {Array.isArray(profile.luneaLines) && profile.luneaLines.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-white/60 mb-1">ルネアの観測ログ</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {profile.luneaLines.map((line, i) => (
                      <li key={i} className="opacity-90">{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 主要セクション（存在するものだけ） */}
              {profile.fortune && (
                <div>
                  <div className="text-sm font-semibold mb-1">運勢</div>
                  <p className="text-sm text-white/85 leading-relaxed">{profile.fortune}</p>
                </div>
              )}
              {profile.personality && (
                <div>
                  <div className="text-sm font-semibold mb-1">性格</div>
                  <p className="text-sm text-white/85 leading-relaxed">{profile.personality}</p>
                </div>
              )}
              {profile.partner && (
                <div>
                  <div className="text-sm font-semibold mb-1">パートナー</div>
                  <p className="text-sm text-white/85 leading-relaxed">{profile.partner}</p>
                </div>
              )}
              {profile.work && (
                <div>
                  <div className="text-sm font-semibold mb-1">仕事/適性</div>
                  <p className="text-sm text-white/85 leading-relaxed">{profile.work}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={goMyPage}
                  className="w-full rounded-lg bg-blue-600 py-2 font-bold hover:bg-blue-500"
                >
                  マイページへ
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <p className="text-sm text-white/75 leading-relaxed">
                プロフィール診断の結果データが見つかりませんでした。
                既に実行済みの場合はブラウザの保存設定をご確認ください。
              </p>
              <button
                onClick={goProfileResult}
                className="mt-4 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
              >
                プロフィール診断の結果へ
              </button>
            </div>
          )}
        </section>

        {/* 補足 */}
        <p className="mt-6 text-center text-[11px] text-white/60">
          ※ 基礎層（クイック診断）は「EΛVƎ＝現在（顕在）」と「EVΛƎ＝未来（潜在）」の二重構造の基準として利用されます。
        </p>
      </div>
    </div>
  )
}

