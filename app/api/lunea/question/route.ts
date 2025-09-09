import { NextResponse } from "next/server"

type EV = "E" | "V" | "Λ" | "Ǝ"
const ALL: EV[] = ["E", "V", "Λ", "Ǝ"]

// JSTの日付を "YYYY-MM-DD" で返す（必要ならクライアント側でも同等関数あり）
function jstYmd() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// slotを決定（クエリ優先 → JST時間帯で自動判定）
function decideSlot(param?: string | null): "A" | "B" | "C" {
  const s = (param || "").toUpperCase()
  if (s === "A" || s === "B" || s === "C") return s
  const h = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours() // JST
  if (h < 12) return "A"
  if (h < 18) return "B"
  return "C"
}

function labelOf(c: EV) {
  switch (c) {
    case "E": return "衝動で一歩踏み出す"
    case "V": return "可能性を広げて眺める"
    case "Λ": return "選択肢を絞って決断する"
    case "Ǝ": return "立ち止まり観測する"
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const slot = decideSlot(url.searchParams.get("slot"))
    const qid = `daily-${jstYmd()}-${slot}`

    // slotごとに subset を切り替え（A=4択、B=3択、C=2択）
    let subset: EV[] = ALL
    if (slot === "B") subset = ALL.slice(0, 3) // 仮：E,V,Λ
    if (slot === "C") subset = ALL.slice(0, 2) // 仮：E,V

    // フロントのQRespに合わせて、choicesはフラット配列で返す
    const choices = subset.map((c) => ({
      code: c,
      label: labelOf(c),
    }))

    // questionはシンプルな文字列で返す（QResp.question: unknown を想定）
    const questionText = "いまのあなたに一番近い“動き”はどれ？"

    return NextResponse.json({
      ok: true,
      question: questionText,
      choices,          // ★ フラット配列
      subset,           // ["E","V",...]（2/3/4択の実体）
      slot,             // "A"|"B"|"C"
      seed: Date.now(), // 任意：フロントでキャッシュ無効化などに使用可
      question_id: qid, // 任意：使わなくてもOK（フロントはJSTで独自生成でも可）
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "question_failed" },
      { status: 500 }
    )
  }
}
