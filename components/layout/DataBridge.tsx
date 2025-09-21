'use client'

import React, { useEffect, useMemo, useState, cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'
import type { MyPageData } from './MyPageShell'

/**
 * DataBridge
 * - demo=true  : モックデータを Shell に注入
 * - demo=false : API から取得して Shell に注入（順次差し替え）
 *
 * 期待される子要素:
 *   <MyPageShell /> など "data" prop を受け取れる要素をちょうど1つ
 */
export default function DataBridge({
  children,
  demo = true,
}: {
  children: ReactNode
  demo?: boolean
}) {
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // --- モック ---
  const MOCK: MyPageData = useMemo(
    () => ({
      user: { name: 'Hiro', displayId: '0001', avatarUrl: null },
      theme: { name: 'LOVE', updated_at: '2025-09-20T21:48:00' },
      quick: { order: ['E', 'V', 'Λ', 'Ǝ'], created_at: '2025-09-20T21:00:00' },
      daily: { code: 'Ǝ', comment: '静かな観測の時間。', created_at: '2025-09-20T21:48:00' },
    }),
    []
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        if (demo) {
          if (!cancelled) setData(MOCK)
        } else {
          // --- ここでAPIを叩いて結合 ---
          // /api/mypage/profile-latest（任意：Quickに寄せる情報があれば）
          // /api/mypage/daily-latest  → daily
          // /api/theme                → theme（既存）
          // /api/user/me（任意）     → user

          const [dailyRes, themeRes] = await Promise.allSettled([
            fetch('/api/mypage/daily-latest').then((r) => r.json()),
            fetch('/api/theme').then((r) => r.json()),
          ])

          const d: MyPageData = {
            user: { name: 'Hiro', displayId: '0001', avatarUrl: null }, // TODO: /api/user へ差し替え
            quick: undefined, // TODO: 必要なら /api/quick-latest を用意して差し込み
            theme:
              themeRes.status === 'fulfilled' && themeRes.value?.item
                ? { name: themeRes.value.item?.theme ?? 'LOVE', updated_at: themeRes.value.item?.updated_at ?? null }
                : undefined,
            daily:
              dailyRes.status === 'fulfilled' && dailyRes.value?.item
                ? {
                    code: dailyRes.value.item?.code ?? null,
                    comment: dailyRes.value.item?.comment ?? null,
                    created_at: dailyRes.value.item?.created_at ?? null,
                  }
                : undefined,
          }

          if (!cancelled) setData(d)
        }
      } catch (_e) {
        if (!cancelled) setData(MOCK) // フォールバック（画面を崩さない）
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [demo, MOCK])

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-center text-neutral-400">
        読み込み中…
      </div>
    )
  }

  // 子要素に data を注入
  if (isValidElement(children)) {
    return cloneElement(children as any, { data })
  }

  // 想定外（子が単一要素でない）
  return <>{children}</>
}
