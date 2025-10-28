// app/api/mypage/quick-latest/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 返却フォーマット（正規化）
 * {
 *   ok: true,
 *   item: {
 *     model: 'EVΛƎ' | 'EΛVƎ' | null,   // ★ フロントは基本これだけ見ればOK
 *     label: string | null,             //   "未来志向型" / "現実思考型"
 *     order: ('E'|'V'|'Λ'|'Ǝ')[] | null,
 *     scores: { E:number|null, V:number|null, Λ:number|null, Ǝ:number|null } | null,
 *     created_at: string | null
 *   } | null,
 *   unauthenticated?: true
 * }
 */
export async function GET() {
  const sb = createRouteHandlerClient({ cookies });
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user ?? null;

  // 未ログイン → 空返し（200）
  if (!user) {
    return NextResponse.json(
      { ok: true, item: null, unauthenticated: true },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    // カラム揺れを避けるために "*" で取得
    const { data } = await sb
      .from("quick_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json(
        { ok: true, item: null },
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    /* ========= 正規化ユーティリティ ========= */
    const toEV = (x: unknown) => {
      const s = String(x ?? "").trim();
      if (s === "E") return "E";
      if (s === "V") return "V";
      if (s === "Λ" || s.toUpperCase() === "L" || s === "∧") return "Λ";
      if (s === "Ǝ") return "Ǝ";
      return null;
    };

    const normalizeOrder = (o: unknown): ("E" | "V" | "Λ" | "Ǝ")[] | null => {
      if (!o) return null;
      let arr: unknown[] = [];
      if (Array.isArray(o)) {
        arr = o;
      } else if (typeof o === "string") {
        try {
          const parsed = JSON.parse(o);
          if (Array.isArray(parsed)) arr = parsed;
          else arr = String(o).split(",").map((s) => s.trim());
        } catch {
          arr = String(o).split(",").map((s) => s.trim());
        }
      }
      const evs = (arr.map(toEV).filter(Boolean) as ("E" | "V" | "Λ" | "Ǝ")[]) ?? [];
      const uniq = Array.from(new Set(evs));
      return uniq.length ? uniq : null;
    };

    const toNum = (v: any): number | null => {
      if (typeof v === "number" && isFinite(v)) return v;
      const n = Number(v);
      return isFinite(n) ? n : null;
    };

    const normalizeScores = (row: any) => {
      // 新：score_map 優先、旧：scores 互換
      const m = row?.score_map ?? row?.scores ?? null;
      if (m && typeof m === "object") {
        return {
          E: toNum(m.E),
          V: toNum(m.V),
          Λ: toNum(m["Λ"] ?? m.L),
          Ǝ: toNum(m["Ǝ"]),
        };
      }
      // 旧：バラカラム（想定される別名を吸収）
      const E = toNum(row?.score_e ?? row?.scoreE ?? row?.e);
      const V = toNum(row?.score_v ?? row?.scoreV ?? row?.v);
      const L = toNum(row?.score_l ?? row?.score_lambda ?? row?.lambda ?? row?.l);
      const EE = toNum(row?.score_echo ?? row?.echo ?? row?.ee);
      if (E == null && V == null && L == null && EE == null) return null;
      return { E, V, Λ: L, Ǝ: EE };
    };

    /* ========= 正規化本体 ========= */
    const model = (data.type_key ?? data.model ?? null) as "EVΛƎ" | "EΛVƎ" | null;
    const label =
      data.type_label ??
      data.label ??
      (model === "EVΛƎ" ? "未来志向型" : model === "EΛVƎ" ? "現実思考型" : null);

    const order = normalizeOrder(data.order_v2 ?? data.order ?? data.rank ?? null);
    const scores = normalizeScores(data);
    const created_at = data.created_at ?? null;

    const item = { model, label, order, scores, created_at };

    return NextResponse.json(
      { ok: true, item },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch {
    // どんな例外でも “成功(null)” で返して UI を止めない
    return NextResponse.json(
      { ok: true, item: null, note: "softened_error" },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }
}
