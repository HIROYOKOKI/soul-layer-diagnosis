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

    // ===== 入力正規化 =====
    const user_id: string | undefined = body.user_id ?? body.userId;
    const type_key: QuickKey | undefined = body.type_key ?? body.typeKey ?? body.model;
    const type_label: string | null = body.type_label ?? body.typeLabel ?? body.label ?? null;
    const env: Env = (body.env ?? body.theme ?? "dev").toLowerCase() === "prod" ? "prod" : "dev";

    // スコアと順序
    const rawScores: Record<string, number> | undefined = body.scores ?? body.points ?? body.points_v2;
    const order: EV[] | undefined = body.order ?? body.order_v2;

    if (!user_id) return bad("user_id_required");
    if (!type_key || (type_key !== "EVΛƎ" && type_key !== "EΛVƎ")) return bad("type_key_invalid");
    if (!rawScores) return bad("points_required");

    // E,V,Λ,Ǝ のみ抽出
    const points_v2: Partial<Record<EV, number>> = {};
    (["E", "V", "Λ", "Ǝ"] as EV[]).forEach((k) => {
      const v = Number(rawScores[k]);
      if (Number.isFinite(v)) points_v2[k] = v;
    });
    if (Object.keys(points_v2).length === 0) return bad("points_empty");

    // ===== データ作成 =====
    const payload = {
      user_id,
      type_key,
      type_label,
      order_v2: order ?? null,
      points_v2,
      theme: env, // dev / prod
    };

    const { data, error } = await sb
      .from("quick_results")
      .insert(payload)
      .select("id, user_id, type_key, type_label, points_v2, order_v2, theme, created_at")
      .single();

    if (error) {
      console.error("[quick/save] supabase error:", error);
      return bad(`supabase_insert_failed: ${error.message}`, 500);
    }

    return ok({ ok: true, item: data });
  } catch (e: any) {
    console.error("[quick/save] fatal:", e);
    return bad(`fatal: ${e?.message ?? "unknown"}`, 500);
  }
}
