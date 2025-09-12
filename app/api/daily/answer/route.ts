import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  id: z.string(),
  first_choice: z.enum(["E","V","Λ","Ǝ"]).nullable().optional(),
  final_choice: z.enum(["E","V","Λ","Ǝ"]),
  changes: z.number().int().min(0).optional().default(0),
  subset: z.array(z.enum(["E","V","Λ","Ǝ"])).nullable().optional(),
  theme: z.string().optional().default("self"),
})

export async function POST(req: Request) {
 const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status:401 })

  const p = schema.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ ok:false, error:"invalid_payload", issues:p.error.issues }, { status:400 })

  const { id, first_choice, final_choice, changes, subset, theme } = p.data
  const slot = getSlot()
  const question_id = id.startsWith("daily-") ? id : buildQuestionId()
  const s = scoreFromChoices(final_choice as EV, first_choice as EV | null)
  const scores = { E: s.E, V: s.V, "Λ": s.L, "Ǝ": s.Eexists }
  const { c: comment, a: affirmation } = buildCopy(final_choice as EV)

  const { data, error } = await supabase
    .from("daily_results")
    .upsert({
      user_id: user.id,
      question_id,
      env: "prod",
      theme,
      code: final_choice,
      scores,
      raw_interactions: {
        first_choice: first_choice ?? null,
        final_choice,
        changes: changes ?? 0,
        subset: subset ?? null,
        slot,
      },
      comment,
      quote: affirmation,
    }, { onConflict: "user_id,question_id,env" })
    .select()
    .single()

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:500 })

  const { count } = await supabase
    .from("daily_results")
    .select("*", { head:true, count:"exact" })
    .eq("user_id", user.id).eq("env","prod")

  const milestone = [10,30,90].find(n => (count ?? 0) === n) ?? null
  return NextResponse.json({ ok:true, item:data, milestone })
}
