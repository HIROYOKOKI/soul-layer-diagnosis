// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"

type EV = "E" | "V" | "Λ" | "Ǝ"
type Slot = "morning" | "noon" | "night"

type Body = {
  id: string
  slot: Slot
  choice: EV
  env?: "dev" | "prod"
  theme?: "dev" | "prod"
  ts?: string
}

/* ========= 文字数ユーティリティ ========= */
const jpLen = (s: string) => Array.from(s ?? "").length
const clampToRange = (text: string, min: number, max: number) => {
  const t = (text || "").trim().replace(/\s+/g, " ")
  if (!t) return t
  if (jpLen(t) <= max) {
    return /[。.!?！？]$/.test(t) ? t : t + "。"
  }
  const arr = Array.from(t).slice(0, max)
  const j = arr.join("")
  const m =
    j.match(/^(.*?)([。.!?！？]|、|,|;|：|:)\s*[^。.!?！？、,;：:]*$/) ||
    j.match(/^(.*?)[\s　][^ \t　]*$/)
  const cut = (m?.[1] || j).replace(/\s+$/, "")
  return (/[。.!?！？]$/.test(cut) ? cut : cut + "。")
}
const inRange = (s: string, min: number, max: number) => {
  const n = jpLen((s || "").trim())
  return n >= min && n <= max
}

/* ========= 仕様（記憶済み） ========= */
const LEN = {
  commentMin: 100,
  commentMax: 150,
  adviceMin: 100,
  adviceMax: 150,
  quoteMin: 15,   // ← “アファメーション”の文字数
  quoteMax: 30,
} as const

/* ========= アファメーション検査/補正 ========= */
const isAffirmation = (s: string) => {
  const t = (s || "").trim()
  // 「私は/わたしは」で始まり、引用符や《》が無い、三人称が主語でない、の簡易チェック
  if (!/^(私は|わたしは)/.test(t)) return false
  if (/[「」『』《》"“”]/.test(t)) return false
  return true
}

const toAffirmationFallback = (code: EV): string => {
  switch (code) {
    case "E": return "私は情熱を信じ一歩踏み出す"
    case "V": return "私は理想を描き形にしている"
    case "Λ": return "私は基準を定め迷いを越える"
    case "Ǝ": return "私は静けさで本質を見つめる"
  }
}

const normalizeAffirmation = (code: EV, s: string): string => {
  let t = (s || "").trim()
  // 引用符や《》などは除去
  t = t.replace(/[「」『』《》"“”]/g, "").trim()
  // 冒頭が一人称でなければ強制変換
  if (!/^(私は|わたしは)/.test(t)) {
    // 既存テキストのキーワードを拾って軽く一人称化（簡易）
    const base = toAffirmationFallback(code)
    t = base
  }
  // 句点付与 & 文字数レンジへ
  t = clampToRange(t, LEN.quoteMin, LEN.quoteMax)
  return t
}

/* ========= フォールバック文言 ========= */
const FB_COMMENT: Record<EV, string> = {
  E: "今は内側の熱が静かに満ちる時期。小さな確定を一つ重ねれば、惰性はほどけていく。視線を近くに置き、今日できる最短の一歩を形にしよう。",
  V: "
