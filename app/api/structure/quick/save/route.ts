import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuickKey = "EVΛƎ" | "EΛVƎ";
type Env = "dev" | "prod";

function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return bad("supabase_env_missing", 500);

    const body = await req.json().catch(() => ({}));

    // ===== 入力の正規化（旧/新の両方を受ける）=====
    const user_id: string | undefined = body.user_id ?? body.userId;
    const type_key: QuickKey | undefined = body.type_key ?? body.typeKey ?? body.model;
    const type_label: string | null = body.type_label ?? body.typeLabel ?? body.label ?? null;
    const color_hex: string | null = body.color_hex ?? body.colorHex ?? null;

    // scores / points はどちらかが来る
    const rawScores: Record<string, number> | undefined = body.scores ?? body.points;
    const order: EV[] | undefined = body.order;

    const env: Env = (body.env ?? body.theme ?? "dev").toLowerCase() === "prod" ? "prod" : "dev";

    // ===== バリデーション =====
    if (!user_id) return bad("user_id_required");
    if (!type_key || (type_key !== "EVΛƎ" && type_key !== "EΛVƎ")) return bad("type_key_invalid");
    if (!rawScores) return bad("scores_required");

    // 数値のみ・E,V,Λ,Ǝ に限定
    const scores: Partial<Record<EV, number>> = {};
    (["E", "V", "Λ", "Ǝ"] as EV[]).forEach((k) => {
      const v = Number(rawScores[k]);
      if (!Number.isFinite(v)) return;
      scores[k] = v;
    });

    // 最低1つは入っていること
    if (Object.keys(scores).length === 0) return bad("scores_empty");

    // ===== 挿入 =====
    // 想定テーブル: quick_results（本番で利用中）
    const payload = {
      user_id,
      type_key,
      type_label,
      color_hex,
      scores,         // JSONB
      order: order ?? null,
      env,            // dev/prod 切り分け
    };

    const { data, error } = await sb
      .from("quick_results")
      .insert(payload)
      .select("id, user_id, type_key, type_label, scores, order, env, created_at")
      .single();

    if (error) {
      // ここで詳細を返す（Vercel のログにも出る）
      console.error("[quick/save] supabase error:", error);
      return bad(`supabase_insert_failed: ${error.message}`, 500);
    }

    return ok({ ok: true, item: data });
  } catch (e: any) {
    console.error("[quick/save] fatal:", e);
    return bad(`fatal: ${e?.message ?? "unknown"}`, 500);
  }
}
