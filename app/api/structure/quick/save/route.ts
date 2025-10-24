// app/api/structure/quick/save/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type ScoreMap = Partial<Record<EV, number>>;

const to100 = (n: number) => (n <= 1 ? n * 100 : n);
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const norm = (n?: number | null) =>
  typeof n === "number" && !Number.isNaN(n) ? clamp(to100(n)) : undefined;

// 並び → スコア（100/75/50/25）
function orderToScoreMap(order: EV[]): ScoreMap {
  const weights = [100, 75, 50, 25];
  const m: any = {};
  order.forEach((k, i) => (m[k] = weights[i] ?? 25));
  return m;
}

export async function POST(req: Request) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });

    const {
      type_key,    // "EVΛƎ" | "EΛVƎ"
      type_label,  // 表示用
      model,       // 互換: "EVΛƎ" | "EΛVƎ"
      label,       // 互換
      order,       // ["E","V","Λ","Ǝ"]
      score_map,   // {E,V,Λ,Ǝ} (0..1 or 0..100)
    } = body as {
      type_key?: "EVΛƎ" | "EΛVƎ";
      type_label?: string;
      model?: "EVΛƎ" | "EΛVƎ";
      label?: string;
      order?: EV[];
      score_map?: ScoreMap;
    };

    // 互換（どちらか入っていればOK）
    const finalTypeKey = type_key ?? model ?? null;
    const finalTypeLabel = type_label ?? label ?? null;

    // score_map が来ていなければ order から自動生成
    let sm: ScoreMap | null = null;
    if (score_map) {
      sm = {
        E: norm(score_map.E),
        V: norm(score_map.V),
        "Λ": norm((score_map as any)["Λ"]),
        "Ǝ": norm((score_map as any)["Ǝ"]),
      };
    } else if (Array.isArray(order) && order.length === 4) {
      sm = orderToScoreMap(order);
    }

    // 保存は order ではなく order_v2 に書く（←ここがポイント）
    const { data, error } = await sb
      .from("quick_results")
      .insert({
        user_id: uid,
        type_key: finalTypeKey,
        type_label: finalTypeLabel,
        order_v2: Array.isArray(order) ? order : null, // ★ order ではなく order_v2
        score_map: sm ?? null,                          // ★ 0..1/0..100どちらでもOK
      })
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
