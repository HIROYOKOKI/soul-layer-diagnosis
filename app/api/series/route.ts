// /app/api/series/route.ts
import { NextResponse as NextResponse3 } from "next/server"

export async function GET(req: Request) {
// days: 7 | 30 | 90 （デフォルト30）
const { searchParams } = new URL(req.url)
const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30", 10) || 30))

// TODO: 実データに差し替え（Supabase等からE/V/Λ/Ǝの合算値を抽出）
const today = new Date()
const data = Array.from({ length: days }, (_, i) => {
const d = new Date(today)
d.setDate(today.getDate() - (days - 1 - i))
return {
date: d.toISOString().slice(0, 10),
E: Math.random(),
V: Math.random(),
L: Math.random(),
Eexists: Math.random(),
}
})

return NextResponse3.json(data)
}
