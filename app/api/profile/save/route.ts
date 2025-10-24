import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScoreMap = Partial<Record<"E"|"V"|"Λ"|"Ǝ", number>>;

export async function POST(req: Request) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status:401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok:false, error:"bad_json" }, { status:400 });

    const { fortune, personality, partner, score_map } = body as {
      fortune?: string | null;
      personality?: string | null;
      partner?: string | null;
      score_map?: ScoreMap | null; // ★ 追加
    };

    // 0〜1 を 0〜100 に正規化して保存（両方来たらそのまま）
    const norm = (n: number) => (n <= 1 ? n * 100 : n);
    const sm = score_map
      ? {
          E: score_map.E != null ? norm(score_map.E) : undefined,
          V: score_map.V != null ? norm(score_map.V) : undefined,
          "Λ": (score_map as any)["Λ"] != null ? norm((score_map as any)["Λ"]) : undefined,
          "Ǝ": (score_map as any)["Ǝ"] != null ? norm((score_map as any)["Ǝ"]) : undefined,
        }
      : null;

    const { data, error } = await sb
      .from("profile_results")
      .insert({
        user_id: uid,
        fortune: fortune ?? null,
        personality: personality ?? null,
        partner: partner ?? null,
        score_map: sm ? sm : null,   // ★ 保存
      })
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });
    return NextResponse.json({ ok:true, item:data });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:String(e?.message ?? e) }, { status:500 });
  }
}
