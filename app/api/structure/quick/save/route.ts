// app/api/structure/quick/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuickKey = "EVΛƎ" | "EΛVƎ";
type Env = "dev" | "prod";

const ok = (d: unknown, s = 200) =>
  NextResponse.json(d, { status: s, headers: { "cache-control": "no-store" } });
const bad = (m: string, s = 400) =>
  NextResponse.json({ ok: false, error: m }, { status: s, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return bad("supabase_env_missing", 500);

    const sb = createRouteHandlerClient({ cookies });
    const { data: auth } = await sb.auth.getUser();
    const authedUserId = auth?.user?.id;

    const body = await req.json().catch(() => ({}));

    // 入力正規化
    const type_key: QuickKey | undefined = body.type_key ?? body.typeKey ?? body.model;
    const type_label: string | null = body.type_label ?? body.typeLabel ?? body.label ?? null;

    // points/scores/points_v2 いずれでもOK
    const raw = body.points_v2 ?? body.scores ?? body.points ?? {};
    const order_v2: EV[] | null = body.order_v2 ?? body.order ?? null;

    const env: Env = (body.env ?? body.theme ?? "dev").toLowerCase() === "prod" ? "prod" : "dev";

    if (!authedUserId) return bad("unauthenticated", 401);
    if (!type_key || (type_key !== "EVΛƎ" && type_key !== "EΛVƎ")) return bad("type_key_invalid");
    if (!raw || typeof raw !== "object") return bad("points_required");

    // E,V,Λ,Ǝ のみ抽出
    const points_v2: Partial<Record<EV, number>> = {};
    (["E", "V", "Λ", "Ǝ"] as EV[]).forEach((k) => {
      const v = Number(raw[k]);
      if (Number.isFinite(v)) points_v2[k] = v;
    });
    if (Object.keys(points_v2).length === 0) return bad("points_empty");

    const payload = {
      user_id: authedUserId,
      type_key,
      type_label,
      order_v2,
      points_v2,
      theme: env, // ← テーブルは theme カラム
    };

    const { data, error } = await admin
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
