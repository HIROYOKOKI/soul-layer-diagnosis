// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
// import { openai } from "@/lib/openai"  // 既存の遅延生成ラッパを使う

export async function POST(req: Request) {
  try {
    const pending = await req.json()

    // 既存の診断ロジックで luneaLines を生成済みと仮定
    // const ai = await openai(...)
    // const luneaLines: string[] = await genLinesWithAI(pending)

    // ---- 仮：既存の生成結果を使う前提（ここはあなたの既存コードを使ってOK） ----
    const luneaLines: string[] = Array.isArray((pending as any)?.__mock_lines)
      ? (pending as any).__mock_lines
      : [
          "観測が終わったよ。これが、きみの“現在の層”の響きだ。",
          "衝動が先に立つけれど、方向づけができれば一気に伸びるタイプだね。",
          "今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。"
        ]

    // ---- ここから detail を必ず埋める処理 ----
    function clampText(s: string, min: number, max: number, fallback: string) {
      const t = (s || "").trim()
      if (t.length >= min && t.length <= max) return t
      if (!t) return fallback
      // 超過ならざっくり切る（語尾処理は簡易）
      return t.slice(0, max)
    }

    // ここでは簡易に luneaLines から要約っぽく組み立てる
    const base1 = luneaLines[1] ?? luneaLines[0] ?? ""
    const base2 = luneaLines[2] ?? luneaLines[1] ?? ""
    const baseLast = luneaLines[luneaLines.length - 1] ?? ""
    const fallbackFortune =
      "今は小さな熱源が灯っている時期。迷いがあっても、最初の一歩を踏み出せば流れは整う。焦らず、でも止まらず、今日の小さな行動を重ねていこう。"
    const fallbackPersonality =
      "衝動と直感が先行しやすいが、方向づけが定まると爆発的に集中できるタイプ。ひとつの芯を決めると継続力が出る。"
    const fallbackWork =
      "すぐに試し、早く学ぶ姿勢が吉。小さな実験を繰り返すタスク設計で成果が伸びる。"
    const fallbackPartner =
      "熱量を尊重しつつ、落ち着いてペースを整えてくれる相手と好相性。"

    const detail = {
      fortune: clampText(`${base1} ${base2}`, 150, 200, fallbackFortune),
      personality: clampText(`${base1} ${baseLast}`, 150, 200, fallbackPersonality),
      work: clampText(base2 || base1, 80, 100, fallbackWork),
      partner: clampText(baseLast || base1, 80, 100, fallbackPartner),
    }

    return NextResponse.json({
      ok: true,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail, // ← UIが自動で4カード表示する
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
