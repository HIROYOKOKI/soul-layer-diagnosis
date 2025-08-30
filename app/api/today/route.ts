/ /app/api/today/route.ts
import { NextResponse as NextResponse2 } from "next/server"
import { createClient as createClient2 } from "@supabase/supabase-js"

const supabase2 = createClient2(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ScoreJson = Partial<Record<"E"|"V"|"L"|"Λ"|"Eexists"|"Ǝ", number>>;

function normalizeScores(j: ScoreJson | null | undefined) {
  const E = Number(j?.E ?? 0)
  const V = Number(j?.V ?? 0)
  const L = Number(j?.L ?? j?.["Λ"] ?? 0)
  const Eexists = Number(j?.Eexists ?? j?.["Ǝ"] ?? 0)
  return { E, V, L, Eexists }
}

export async function GET() {
try {
const { data, error } = await supabase2
.from("daily_results")
.select("created_at, structure_score, code, comment")
.order("created_at", { ascending: false })
.limit(1)
.maybeSingle()

if (error) throw error

const scores = normalizeScores(data?.structure_score)
const latest = {
code: (data?.code ?? "Ǝ") as string,
text: data?.comment ?? "—",
date: (data?.created_at ?? new Date().toISOString()).slice(0, 10),
}

return NextResponse2.json({ scores, latest })
} catch (e) {
// フォールバック
return NextResponse2.json({
scores: { E: 0.65, V: 0.8, L: 0.45, Eexists: 0.7 },
latest: {
code: "Ǝ",
text: "静かに観察したい",
date: new Date().toISOString().slice(0, 10),
},
})
}
}
