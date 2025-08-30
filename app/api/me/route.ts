// /app/api/me/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, plan")
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      plan: String(data?.plan ?? "FREE").toUpperCase(),
      name: data?.name ?? "Hiro",
      id: String(data?.id ?? "0001"),
    })
  } catch (e) {
    return NextResponse.json({
      plan: "FREE",
      name: "Hiro",
      id: "0001",
    })
  }
}
