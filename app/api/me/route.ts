// app/api/me/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient(); // ✅ await

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: data.user });
}
