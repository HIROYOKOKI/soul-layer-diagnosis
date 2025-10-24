import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E"|"V"|"Λ"|"Ǝ";
type ScoreMap = Partial<Record<EV, number>>;

function orderToScoreMap(order: EV[]): ScoreMap {
  // 並び優先度で 100,75,50,25 を割り当てる（必要なら調整可）
  const weights = [100, 75, 50, 25];
  const sm: any = {};
  order.forEach((k, i) => { sm[k] = weights[i] ?? 25; });
  return sm;
}
const norm = (n:number)=> (n<=1 ? n*100 : n);

export async function POST(req: Request) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status:401 });

    const body = await req.json().catch(()=>null);
    if (!body) return NextResponse.json({ ok:false, error:"bad_json" }, { status:400 });

    const { type_key, type_label, order, score_map } = body as {
      type_key?: "EVΛƎ"|"EΛVƎ";
      type_label?: string;
      order?: EV[];
      score_map?: ScoreMap;
    };

    // score_map が来なければ order から推定。どちらも無ければ軽いデフォルト。
    let sm: ScoreMap | null = null;
    if (score_map) {
      sm = {
        E: score_map.E!=null? norm(score_map.E):undefined,
        V: score_map.V!=null? norm(score_map.V):undefined,
        "Λ": (score_map as any)["Λ"]!=null? norm((score_map as any)["Λ"]):undefined,
        "Ǝ": (score_map as any)["Ǝ"]!=null? norm((score_map as any)["Ǝ"]):undefined,
      };
    } else if (Array.isArray(order) && order.length===4) {
      sm = orderToScoreMap(order);
    } else {
      sm = { E:60, V:55, "Λ":50, "Ǝ":45 };
    }

    const { data, error } = await sb
      .from("quick_results")
      .insert({
        user_id: uid,
        type_key: type_key ?? null,
        type_label: type_label ?? null,
        order: Array.isArray(order) ? order : null,
        score_map: sm, // ★ 保存
      })
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });
    return NextResponse.json({ ok:true, item:data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message ?? e) }, { status:500 });
  }
}
