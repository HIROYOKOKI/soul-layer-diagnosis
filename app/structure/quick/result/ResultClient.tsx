'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

// Quick v2 payload（Confirmで保存したものを読む）
type PendingV2 = {
  order: EV[]
  labels: Record<EV, string>
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

