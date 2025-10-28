// app/api/structure/quick/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== 型 ===== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type ScoreMap = Partial<Record<EV, number>>;

type Body = {
  type_key?: "EVΛƎ" | "EΛVƎ" | null; // 新
  type_label?: string | null;         // 新
  model?: "EVΛƎ" | "EΛVƎ" | null;     // 旧互換
  label?: string | null;              // 旧互換
  order?: EV[] | string | null;       // ["E","V","Λ","Ǝ"] or "E,V,Λ,Ǝ" or JSON文字列
  score_map?: ScoreMap | null;        // {E,V,Λ,Ǝ} 0..1 or 0..100
  env?: "dev" | "prod" | null;
};

/* ===== Utils ===== */
const toEV = (x: unknown): EV | null => {
  const s = String(x ?? "").trim();
  if (s === "E") return "E";
  if (s === "V") return "V";
  if (s === "Λ" || s.toUpperCase() === "L") return "Λ";
  if (s === "Ǝ" || s.toUpperCase() === "EEXISTS") return "Ǝ";
  return null;
};

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

/** 文字列/配列/JSON文字列 → EV[] | null */
const normalizeOrder = (raw: unknown): EV[] | null => {
  if (!raw) return null;
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
      else arr = raw.split(",").map((s) => s.trim());
    } catch {
      arr = raw.split(",").map((s) => s.trim());
    }
  }
  const evs = uniq(arr.map(toEV).filter(Boolean) as EV[]);
  return evs.length ? evs : null;
};

/** 0..1 か 0..100 をどちらでも受けて 0..100 に統一（NaNは null） */
const to100 = (n: unknown): number | null => {
  const v = typeof n === "number" ? n : Number(n);
  if (!isFinite(v)) return null;
  const x = v <= 1 ? v * 100 : v;
  const clamped = Math.max(0, Math.min(100, x));
  return clamped;
};

/** undefined を null に寄せる（JSONB安全） */
const nn = <T>(v: T | undefined): T | null => (v === undefined ? null : (v as any));

/** スコアマップ正規化（0..100 / null） */
const normalizeScores = (m?: ScoreMap | null) => {
  if (!m) return null;
  return {
    E: to100(m.E),
    V: to100(m.V),
    Λ: to100((m as any)["Λ"]),
    Ǝ: to100((m as any)["Ǝ"]),
  };
};

/** 並び → 重み（100/75/50/25） */
const orderToScoreMap = (order: EV[] | null): ScoreMap | null => {
  if (!order || !order.length) return null;
  const weights = [100, 75, 50, 25];
  const m: ScoreMap = {};
  order.forEach((k, i) => (m[k] = weights[i] ?? 25));
  return m;
};

/* ===== Handler ===== */
export async function POST(req: NextRequest) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id ?? null;

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401, headers: { "cache-control": "no-store" } }
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "bad_json" },
        { status: 400, headers: { "cache-control": "no-store" } }
      );
    }

    // 型の正規化
    const finalTypeKey = (body.type_key ?? body.model ?? null) as "EVΛƎ" | "EΛVƎ" | null;
    const finalTypeLabel =
      body.type_label ??
      body.label ??
      (finalTypeKey === "EVΛƎ" ? "未来志向型" : finalTypeKey === "EΛVƎ" ? "現実思考型" : null);

    const order_v2 = normalizeOrder(body.order);
    // スコア：優先 score_map、なければ order から自動生成
    const score_from_map = normalizeScores(body.score_map);
    const score_from_order = orderToScoreMap(order_v2);
    const score_map = score_from_map ?? score_from_order ?? null;

    const row = {
      user_id: uid,
      type_key: nn(finalTypeKey),
      type_label: nn(finalTypeLabel),
      order_v2: nn(order_v2),
      score_map: nn(score_map),
      env: (body.env ?? "dev") as "dev" | "prod",
    };

    const { data, error } = await sb
      .from("quick_results")
      .insert(row)
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, id: data?.id ?? null, created_at: data?.created_at ?? null },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
