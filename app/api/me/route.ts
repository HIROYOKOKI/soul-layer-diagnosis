// app/api/me/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401, headers: { "cache-control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, id: user.id },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
