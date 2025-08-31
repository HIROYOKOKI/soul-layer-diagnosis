// app/mypage/MyPageClient.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ProfileItem = {
  fortune: string
  personality: string
  partner: string
  created_at: string
}

type DailyItem = {
  code: string
  comment: string
  quote: string
  created_at: string
}

type ApiOk<T> = { ok: true; item: T | null }
type ApiErr = { ok: false; error: string }
type ApiResp<T> = ApiOk<T> | ApiErr

type DailyCode = "E" | "V" | "Λ" | "Ǝ"

const CODE_LABEL: Record<DailyCode, string> = {
  E: "衝動・情熱",
  V: "可能性・夢",
  Λ: "選択・葛藤",
  Ǝ: "観測・静寂",
}

const CODE_COLOR: Record<DailyCode, string> = {
  E: "bg-rose-600",
  V: "bg-indigo-600",
  Λ: "bg-amber-600",
  Ǝ: "bg-emerald-600",
}

function normalizeCode(code?: string): DailyCode | null {
  const x = (code ?? "").trim()
  if (x === "∃" || x === "ヨ") return "Ǝ"
  if (x === "A") return "Λ"
  if (x === "E" || x === "V" || x === "Λ" || x === "Ǝ") return x
  return null
}

function fmt(ts: string) {
  // 表示は一旦ローカル時刻
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function MyPageClient() {
  const [profile, setProfile] = useState<ProfileItem | null>(null)
  const [daily, setDaily] = useState<DailyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)

    const ac = new AbortController()
    try {
      // プロフィール最新
      const pRes = await fetch("/api/mypage/profile-latest", {
        cache: "no-store",
        signal: ac.signal,
      })
      const pJson = (await pRes.json()) as ApiResp<ProfileItem>
      if ("ok" in pJson && pJson.ok) setProfile(pJson.item ?? null)

      // デイリー最新
      const dRes = await fetch("/api/mypage/daily-latest", {
        cache: "no-store",
        signal: ac.signal,
      })
      const dJson = (await dRes.json()) as ApiResp<DailyItem>
      if ("ok" in dJson && dJson.ok) setDaily(dJson.item ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初回ロード
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dailyCode = normalizeCode(daily?.code ?? "")

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Page</h1>
        <div className="flex gap-2">
          <Link href="/profile" className="px-3 py-1.5 rounded-lg bg-black text-white text-sm">
            プロフィール診断へ
          </Link>
          <Link href="/daily/question" className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-sm">
            デイリー診断へ
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="text-sm">Error: {error}</p>
          <button
            className="mt-2 rounded bg-red-600 px-3 py-1.5 text-white text-sm"
            onClick={() => load()}
          >
            再読み込み
          </button>
        </div>
      )}

      {/* プロフィール最新 */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold text-lg mb-2">最新プロフィール診断</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">読み込み中…</p>
        ) : profile ? (
          <div className="text-sm leading-relaxed">
            <p><strong>運勢:</strong> {profile.fortune}</p>
            <p><strong>性格:</strong> {profile.personality}</p>
            <p><strong>理想の相手:</strong> {profile.partner}</p>
            <p className="text-gray-400 text-xs mt-1">{fmt(profile.created_at)}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            まだプロフィール診断がありません。
            <Link href="/profile" className="ml-3 underline">診断をはじめる</Link>
          </div>
        )}
      </section>

      {/* デイリー最新 */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold text-lg mb-2">最新デイリー診断</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">読み込み中…</p>
        ) : daily ? (
          <div className="text-sm leading-relaxed">
            <p className="flex items-center gap-2">
              {dailyCode ? (
                <>
                  <span className={`text-xs text-white px-2 py-0.5 rounded ${CODE_COLOR[dailyCode]}`}>
                    {dailyCode}
                  </span>
                  <span className="text-xs text-gray-500">{CODE_LABEL[dailyCode]}</span>
                </>
              ) : (
                <span className="text-xs text-gray-500">タイプ: {daily.code}</span>
              )}
            </p>
            <p className="mt-2"><strong>コメント:</strong> {daily.comment}</p>
            <p className="mt-1 text-sm opacity-80">“{daily.quote}”</p>
            <p className="text-gray-400 text-xs mt-2">{fmt(daily.created_at)}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            まだデイリー診断がありません。
            <Link href="/daily/question" className="ml-3 underline">今日の質問に答える</Link>
          </div>
        )}
      </section>
    </div>
  )
}
