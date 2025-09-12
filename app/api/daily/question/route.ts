// app/api/daily/question/route.ts
import { NextResponse } from "next/server"
import { buildQuestionId, getSlot } from "@/lib/daily"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const slot = getSlot()
  const id = buildQuestionId()
  const text = ["今の一歩に最も近いのは？","今日の選択の軸はどれ？","いま優先したい感覚は？"][slot-1]
  return NextResponse.json({
    ok: true,
    item: {
      id, slot, text,
      options: [
        { key: "E", label: "衝動・情熱" },
        { key: "V", label: "可能性・夢" },
        { key: "Λ", label: "選択・設計" },
        { key: "Ǝ", label: "観測・静寂" },
      ],
    }
  })
}
