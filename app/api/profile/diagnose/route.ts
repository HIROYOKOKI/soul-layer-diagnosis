import { NextResponse } from "next/server"

type DiagnoseDetail = {
  fortune: string
  personality: string
  work: string
  partner: string
}

function softClampText(
  src: string,
  opts: { min: number; max: number; tol?: number; fallback: string }
) {
  const { min, max, tol = 20, fallback } = opts
  const text = (src || "").trim()
  if (!text) return fallback
  if (text.length > max + tol) return text.slice(0, max)
  if (text.length < min - tol) {
    const need = min - text.length
    const add = (fallback || "").slice(0, need + 10)
    const merged = (text + " " + add).replace(/\s+/g, " ").trim()
    return merged.length > max ? merged.slice(0, max) : merged
  }
  return text
}

export async function POST(req: Request) {
  try {
    const pending = await req.json()

    // === 既存の生成結果を想定（luneaLines を必ず用意） ===
    let luneaLines: string[] = []
    const mock = (pending as any)?.__mock_lines
    if (Array.isArray(mock)) {
      luneaLines = mock as string[]
    } else {
      luneaLines = [
        "観測が終わったよ。これが、きみの“現在の層”の響きだ。",
        "衝動が先に立つけれど、方向づけができれば一気に伸びるタイプだね。",
        "今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。",
      ]
    }

    // === detail を必ず埋める（±10〜20字の揺れは許容） ===
    const b0 = luneaLines[0] ?? ""
    const b1 = luneaLines[1] ?? b0
    const b2 = luneaLines[2] ?? b1
    const blast = luneaLines[luneaLines.length - 1] ?? b2

    const fallbackFortune =
      "今は小さな熱源が灯っている時期。迷いがあっても、最初の一歩を踏み出せば流れは整う。焦らず、でも止まらず、今日の小さな行動を重ねていこう。"
    const fallbackPersonality =
      "直感の火力が高く、方向が定まると一気に集中できるタイプ。芯を決めると継続力が生まれ、周囲を巻き込む推進力に変わる。"
    const fallbackWork =
      "小さく試す→すぐ学ぶの反復が吉。短いスプリントで検証を回すと成果が伸びる。"
    const fallbackPartner =
      "熱量を尊重しつつ、リズムを整えてくれる相手と好相性。歩幅を合わせてくれる関係が長続きする。"

    const detail: DiagnoseDetail = {
      fortune: softClampText(`${b1} ${b2}`,       { min: 150, max: 200, tol: 20, fallback: fallbackFortune }),
      personality: softClampText(`${b1} ${blast}`, { min: 150, max: 200, tol: 20, fallback: fallbackPersonality }),
      work: softClampText(b2 || b1,               { min:  80, max: 100, tol: 20, fallback: fallbackWork }),
      partner: softClampText(blast || b1,         { min:  80, max: 100, tol: 20, fallback: fallbackPartner }),
    }

    return NextResponse.json({
      ok: true,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail, // ← UI は自動で4カード表示
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
