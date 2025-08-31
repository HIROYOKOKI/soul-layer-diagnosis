import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type Body = {
  name: string
  birthday: string   // YYYY-MM-DD
  blood: string
  gender: string
  preference?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>
    const { name, birthday, blood, gender, preference } = body

    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json({ ok:false, error:"missing_params" }, { status:400 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({ name, birthday, blood, gender, preference: preference ?? null })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ ok:false, error:"insert_failed", detail:error.message }, { status:500 })
    }

    return NextResponse.json({ ok:true, profileId: data.id })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok:false, error:"internal_error", detail }, { status:500 })
  }
}
