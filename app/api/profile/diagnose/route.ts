// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
// 既存の OpenAI/Supabase ラッパがあればそれを使ってOK
// import { getOpenAI } from "@/lib/openai"

type DiagnoseDetail = {
  fortune: string
  personality: string
  work: string
  partner: string
}

function softClampText(
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
  const text = (src || "").trim()
  if (!text) return fallback

  // 許容上限超え → 強制カット
  if (text.length > max + tol) return text.slice(0, max)

  // 許容下限未満 → 簡易追記で底上げ（句点で終わらせる）
  if (text.length < min - tol) {
    const need = (min - text.length)
    const add = (fallback || "").slice(0, need + 10)
    const merged = (text + " " + add).replace(/\s+/g, " ").trim()
    return merged.length > max ? merged.slice(0, max) : merged
  }

  // 許容範囲内はそのまま
  return text
}

export async function POST(req: Request) {
  try {
    const pending = await req.json()

    // === 既存処理：プロフィール→AI生成 ===
    // const openai = getOpenAI()
    // const { luneaLines, ... } = await callYourAI(pending)
    // ここでは既存の luneaLines が返ってくる前提で進めます
    const luneaLines: string[] = Array.isArray((pending as any)?.__mock_lines)
      ? (pending as any).__mock_lines
      : [
          "観測が終わったよ。これが、きみの“現在の層”の響
