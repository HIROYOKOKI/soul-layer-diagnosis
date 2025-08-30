// /app/api/today/route.ts
import { NextResponse as NextResponse2 } from "next/server"

export async function GET() {
// TODO: 実データに差し替え（当日の合成スコア + 直近メッセージ）
return NextResponse2.json({
scores: { E: 0.65, V: 0.8, L: 0.45, Eexists: 0.7 },
latest: {
code: "Ǝ",
text: "静かに観察したい",
date: new Date().toISOString().slice(0, 10),
},
})
}
