// /app/api/daily/save/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  // 先頭/末尾の余計なクォートやカンマを除去してトリム
  return v.replace(/^[\s'"]+|[,'"\s]+$/g, "").trim() || null;
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok:false, error:"INVALID_JSON" }, { status:400 });
  }

  // 既定（テーブル制約に合わせる）
  const navigator = cleanStr(body.navigator) ?? "lunea";
  const mode      = cleanStr(body.mode)      ?? "friend";

  const payload = {
    code: cleanStr(body.code),
    comment: typeof body.comment === "string" ? body.comment : null,
    quote: typeof body.quote === "string" ? body.quote : null,
    structure_score: body && typeof body.structure_score === "object" ? body.structure_score : null,
    raw_interactions: body && typeof body.raw_interactions === "object" ? body.raw_interactions : null,
    env: cleanStr(body.env),
    navigator,
    mode,
    choice: cleanStr(body.choice),
    theme: cleanStr(body.theme),
  };

  const { data, error } = await sb
    .from("daily_results")
    .insert(payload)
    .select("id, created_at, code, comment, quote, structure_score, env, navigator, mode")
    .maybeSingle();

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  return NextResponse.json({ ok:true, item:data });
}
