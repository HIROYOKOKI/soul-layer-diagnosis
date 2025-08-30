// /app/api/series/route.ts
import { NextResponse as NextResponse3 } from "next/server"
import { createClient as createClient3 } from "@supabase/supabase-js"

const supabase3 = createClient3(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
const { searchParams } = new URL(req.url)
const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30", 10) || 30))

try {
const since = new Date()
since.setDate(since.getDate() - days)

const { data, error } = await supabase3
.from("daily_results")
.select("created_at, structure_score")
.gte("created_at", since.toISOString())
.order("created_at", { ascending: true })

if (error) throw error

const rows = (data ?? []).map((d: any) => {
const s = normalizeScores(d.structure_score)
return { date: String(d.created_at).slice(0, 10), ...s }
})

return NextResponse3.json(rows)
} catch (e) {
// フォールバック（乱数生成）
const today = new Date()
const rows = Array.from({ length: days }, (_, i) => {
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
return NextResponse3.json(rows)
}
} = new URL(req.url)
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
