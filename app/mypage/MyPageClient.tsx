"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

type EV = "E" | "V" | "Λ" | "Ǝ"
type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  created_at?: string
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: EV[] | null
}
type DailyLatest = { code?: string | null; comment?: string | null; quote?: string | null; created_at?: string }

function toTypeLabel(model?: string | null) {
  if (model === "EΛVƎ") return "現実思考型"
  if (model === "EVΛƎ") return "未来志向型"
  return null
}
function fmt(dt?: string) {
  try {
    const d = dt ? new Date(dt) : new Date()
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d)
  } catch { return "" }
}
// いまは仮のユーザー情報（認証導入後に差し替え）
const FALLBACK_USER = { name: "Hiro", idNo: "0001", avatar: "/icon-512.png" }
const CURRENT_THEME = "self"

export default function MyPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError(null); setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }).then(r => r.json()),
          fetch("/api/mypage/daily-latest",   { cache: "no-store" }).then(r => r.json()),
        ])
        if (!alive) return
        if (!p?.ok) throw new Error(p?.error || "profile_latest_failed")
        if (!d?.ok) throw new Error(d?.error || "daily_latest_failed")
        setProfile(p.item ?? null)
        setDaily(d.item ?? null)
      } catch (e:any) {
        if (alive) setError(e?.message || "failed")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const typeLabel = toTypeLabel(profile?.base_model)
  const nowStr = fmt()

  const goDaily = () => router.push("/daily/question")
  const goSettings = () => router.push("/settings") // 未作成なら後日

  return (
    <div className="min-h-screen bg-black text-white px-5 py-6 max-w-md mx-auto">
      {/* 1) クイック診断の型（上部中央） */}
      <div className="text-center mb-3">
        <span className={`inline-block rounded-lg px-3 py-1 text-sm border
          ${profile?.base_model === "EΛVƎ"
            ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-200"
            : "border-pink-400/30 bg-pink-400/15 text-pink-200"}`}>
          {typeLabel ?? "—"}{typeLabel ? `（${profile?.base_model}）` : ""}
        </span>
      </div>

      {/* 2) プロフィール行（名前/IDはアイコン横中央）＋ 設定ボタン */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <Image src={FALLBACK_USER.avatar} alt="Profile Icon" width={48} height={48}
            className="h-12 w-12 rounded-full border border-white/20 bg-black/20" />
          <div className="flex flex-col justify-center">
            <div className="text-base font-semibold leading-tight">{FALLBACK_USER.name}</div>
            <div className="text-xs text-white/60 leading-tight">ID: {FALLBACK_USER.idNo}</div>
          </div>
        </div>
        <button
          onClick={goSettings}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
          title="設定"
        >
          <span>⚙️</span>設定
        </button>
      </div>

      {/* 3) テーマ＆日時（アイコン直下・左端揃え） */}
      <div className="mb-4 text-[11px] text-white/50">
        テーマ: {CURRENT_THEME}<span className="opacity-40 mx-1">•</span>{nowStr}
      </div>

      {/* 4) 直近メッセージカード */}
      <section className="mb-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold">直近のメッセージ</h2>
          <span className="text-[11px] text-white/50">{fmt(daily?.created_at || profile?.created_at || "")}</span>
        </div>
        <p className="text-sm text-white/90">
          {daily?.comment || profile?.fortune || "まだメッセージはありません。"}
        </p>
      </section>

      {/* 5) 構造ビジュアル（プレースホルダ） */}
      <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">構造バランス</h2>
          <div className="text-[11px] text-white/60">レーダー</div>
        </div>
        <div className="grid place-items-center h-56 rounded-xl bg-black/25 border border-white/10">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 rounded-[20%] border border-cyan-400/40 rotate-45 bg-cyan-400/10" />
            <div className="absolute inset-6 rounded-[20%] border border-cyan-400/30 rotate-45" />
            <div className="absolute inset-12 rounded-[20%] border border-cyan-400/20 rotate-45" />
          </div>
        </div>
        <div className="mt-2 text-center text-[11px] text-white/50">（スワイプで折れ線に切替予定）</div>
      </section>

      {/* 6) 次の一歩（将来 weekly/monthly 追加予定） */}
      <section className="mt-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <h2 className="text-sm font-bold mb-3">次の一歩を選んでください</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={goDaily} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 hover:bg-white/15">
            デイリー診断
            <div className="text-[11px] text-white/60 mt-1">1問 / 今日のゆらぎ</div>
          </button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/50 cursor-not-allowed" title="近日公開">
            診断タイプを選ぶ
            <div className="text-[11px] text-white/40 mt-1">Weekly / Monthly（予定）</div>
          </button>
        </div>
      </section>
    </div>
  )
}
