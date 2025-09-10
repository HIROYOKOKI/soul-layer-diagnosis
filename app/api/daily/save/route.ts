// /app/api/daily/save/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";         // Edge回避
export const dynamic = "force-dynamic";  // キャッシュ回避

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "supabase_env_missing" },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  // サニタイズ（想定キー以外は捨てる）
  const payload = {
    code: typeof body.code === "string" ? body.code : null,
    comment: typeof body.comment === "string" ? body.comment : null,
    quote: typeof body.quote === "string" ? body.quote : null,
    structure_score:
      body && typeof body.structure_score === "object"
        ? body.structure_score
        : null,
    raw_interactions:
      body && typeof body.raw_interactions === "object"
        ? body.raw_interactions
        : null,
    env: typeof body.env === "string" ? body.env : null,
  };

  const { data, error } = await sb
    .from("daily_results")
    .insert(payload)
    .select(
      "id, created_at, code, comment, quote, structure_score, raw_interactions, env"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, item: data });
}
