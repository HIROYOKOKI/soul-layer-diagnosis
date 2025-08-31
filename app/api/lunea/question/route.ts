import { NextResponse } from "next/server"
export async function GET() {
  return NextResponse.json({
    ok: true,
    question: {
      id: "q-001",
      text: "いまのあなたに一番近い“動き”はどれ？",
      options: [
        { id: "a1", label: "衝動で一歩踏み出す", code: "E" },
        { id: "a2", label: "可能性を広げて眺める", code: "V" },
        { id: "a3", label: "選択肢を絞って決断する", code: "Λ" },
        { id: "a4", label: "立ち止まり観測する",   code: "Ǝ" },
      ],
    },
  })
}
