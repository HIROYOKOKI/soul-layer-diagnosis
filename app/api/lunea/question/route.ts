import { NextResponse } from "next/server"

type EV = "E" | "V" | "Λ" | "Ǝ"
const ALL: EV[] = ["E", "V", "Λ", "Ǝ"]

// JSTの日付を "YYYY-MM-DD" で返す
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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slot = decideSlot(url.searchParams.get("slot"))
  const qid = `daily-${jstYmd()}-${slot}`

  // slotごとに subset を切り替え（A=4択、B=3択、C=2択）
  let subset: EV[] = ALL
  if (slot === "B") subset = ALL.slice(0, 3) // 仮：E,V,Λ
  if (slot === "C") subset = ALL.slice(0, 2) // 仮：E,V

  const options = subset.map((c, i) => ({
    id: `a${i + 1}`,
    code: c,
    label:
      c === "E"
        ? "衝動で一歩踏み出す"
        : c === "V"
        ? "可能性を広げて眺める"
        : c === "Λ"
        ? "選択肢を絞って決断する"
        : "立ち止まり観測する",
  }))

  return NextResponse.json({
    ok: true,
    question: {
      id: qid,
      text: "いまのあなたに一番近い“動き”はどれ？",
      options,
    },
    subset,
    slot,
  })
}
