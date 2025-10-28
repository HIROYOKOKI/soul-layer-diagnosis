// app/api/profile/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== Types ===== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type ScoreMap = Partial<Record<EV, number>>;

type Body = {
  // プロフィール入力から来る想定
  name?: string | null;

  // 診断詳細（任意）
  fortune?: string | null;
  personality?: string | null;
  work?: string | null;
  partner?: string | null;

  // 構造スコア（任意）
  score_map?: ScoreMap | null;
};

/* ===== Helpers ===== */
function normalizeScore(n: unknown): number | undefined {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return undefined;
  // 0〜1表記なら 0〜100 に、既に100スケールならそのまま
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
}

function makeUserNo(userId: string) {
  const short = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `U-${short}`;
}

/* ===== Route ===== */
export async function POST(req: NextRequest) {
  try {
    const sb = createRouteHandlerClient({ cookies });

    // 認証チェック
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401, headers: { "cache-control": "no-store" } }
      );
    }

    // 入力
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "bad_json" },
        { status: 400, headers: { "cache-control": "no-store" } }
      );
    }

    const name = (body.name ?? "").toString().trim() || null;
    const fortune = body.fortune ?? null;
    const personality = body.personality ?? null;
    const work = body.work ?? null;
    const partner = body.partner ?? null;

    // スコア正規化（無ければ null）
    const smIn = body.score_map ?? null;
    const score_map: ScoreMap | null = smIn
      ? {
          E: normalizeScore(smIn.E),
          V: normalizeScore(smIn.V),
          Λ: normalizeScore((smIn as any)["Λ"]),
          Ǝ: normalizeScore((smIn as any)["Ǝ"]),
        }
      : null;

    /* --- 1) profiles に name を反映 / user_no が無ければ付与 --- */
    {
      // 既存プロフィールを確認
      const { data: prof } = await sb
        .from("profiles")
        .select("id, user_no, name")
        .eq("id", user.id)
        .maybeSingle();

      const patch: Record<string, any> = {};
      if (name && name !== (prof?.name ?? null)) patch.name = name;
      if (!prof?.user_no) patch.user_no = makeUserNo(user.id);

      if (Object.keys(patch).length > 0) {
        await sb.from("profiles").upsert({ id: user.id, ...patch }, { onConflict: "id" });
      }
    }

    /* --- 2) profile_results に保存 --- */
    const { data, error } = await sb
      .from("profile_results")
      .insert({
        user_id: user.id,
        fortune,
        personality,
        work,
        partner,
        // JSONB カラム想定（存在しない環境でも null ならOK）
        score_map: score_map ?? null,
      })
      .select("id, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item: {
          id: data?.id ?? null,
          created_at: data?.created_at ?? null,
        },
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
