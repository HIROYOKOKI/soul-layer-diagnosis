// /app/api/daily/save/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 余計なクォートやカンマを除去
function cleanStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.replace(/^[\s'"]+|[,'"\s]+$/g, "").trim() || null;
}

// JSON以外でも text を受けて parse を試みる
async function safeParseJSON(req: Request): Promise<any> {
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      return await req.json();
    }
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    // ダメなら空オブジェクトで継続（必須項目は下で補う）
    return {};
  }
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  const body = await safeParseJSON(req);

  // テーブル制約に合わせたデフォルト（NULL制約がある想定）
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
