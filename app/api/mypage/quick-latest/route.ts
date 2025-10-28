// app/api/mypage/quick-latest/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 返却フォーマット
 * {
 *   ok: true,
 *   item: {
 *     type_key: 'EVΛƎ' | 'EΛVƎ' | null,
 *     type_label: string | null,
 *     order: ('E'|'V'|'Λ'|'Ǝ')[] | null,
 *     scores: { E:number|null, V:number|null, Λ:number|null, Ǝ:number|null },
 *     created_at: string | null
 *   } | null,
 *   unauthenticated?: true
 * }
 */
export async function GET() {
  const sb = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: uerr,
  } = await sb.auth.getUser();

  // 未ログイン → 空返し
  if (uerr || !user) {
    return NextResponse.json(
      { ok: true, item: null, unauthenticated: true },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  // あり得る全カラムを拾う（旧/新の互換）
  const { data, error } = await sb
    .from("quick_results")
    .select(
      [
        "user_id",
        "model",        // 旧
        "label",        // 旧
        "type_key",     // 新
        "type_label",   // 新
        "order",        // 旧（配列 or 文字列）
        "order_v2",     // 新（配列）
        "score_map",    // 新（{E,V,Λ,Ǝ}）
        "score_e",      // 旧ばらし
        "score_v",
        "score_l",
        "score_eexists",
        "created_at",
      ].join(",")
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // 正規化ユーティリティ
  const toEV = (x: unknown) => {
    const s = String(x ?? "").trim();
    if (s === "E") return "E";
    if (s === "V") return "V";
    if (s === "Λ" || s.toUpperCase() === "L") return "Λ";
    if (s === "Ǝ" || s.toUpperCase() === "EEXISTS") return "Ǝ";
    return null;
  };

  const normalizeOrder = (o: unknown): ("E" | "V" | "Λ" | "Ǝ")[] | null => {
    if (!o) return null;
    let arr: unknown[] = [];
    if (Array.isArray(o)) arr = o;
    else if (typeof o === "string") {
      try {
        const parsed = JSON.parse(o);
        if (Array.isArray(parsed)) arr = parsed;
      } catch {
        // カンマ区切りの文字列などに対応
        arr = o.split(",").map((s: string) => s.trim());
      }
    }
    const evs = (arr.map(toEV).filter(Boolean) as ("E" | "V" | "Λ" | "Ǝ")[]) ?? [];
    // ユニーク化
    const uniq = Array.from(new Set(evs));
    return uniq.length ? uniq : null;
  };

  const normalizeScores = (row: any) => {
    // score_map優先、無ければ旧カラム
    if (row?.score_map && typeof row.score_map === "object") {
      const m = row.score_map;
      return {
        E: typeof m.E === "number" ? m.E : null,
        V: typeof m.V === "number" ? m.V : null,
        Λ: typeof m["Λ"] === "number" ? m["Λ"] : (typeof m.L === "number" ? m.L : null),
        Ǝ: typeof m["Ǝ"] === "number" ? m["Ǝ"] : (typeof m.Eexists === "number" ? m.Eexists : null),
      };
    }
    return {
      E: row?.score_e ?? null,
      V: row?.score_v ?? null,
      Λ: row?.score_l ?? null,
      Ǝ: row?.score_eexists ?? null,
    };
  };

  const item = data
    ? {
      type_key: data.type_key ?? data.model ?? null,
      type_label: data.type_label ?? data.label ?? null,
      order: normalizeOrder(data.order_v2 ?? data.order),
      scores: normalizeScores(data),
      created_at: data.created_at ?? null,
    }
    : null;

  return NextResponse.json(
    { ok: true, item },
    { headers: { "cache-control": "no-store" } }
  );
}
