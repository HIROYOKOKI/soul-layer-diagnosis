import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// U-XXXXXX を生成（安定：ユーザーID由来）
function genUserNo(userId: string) {
  const base = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `U-${base}`;
}

export async function GET(req: NextRequest) {
  const sb = createRouteHandlerClient({ cookies });

  // 認証確認
  const { data: auth, error: userErr } = await sb.auth.getUser();
  const user = auth?.user ?? null;

  if (userErr || !user) {
    return NextResponse.json(
      { ok: true, item: null, unauthenticated: true },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  // profiles から基本メタ取得
  const { data: row, error } = await sb
    .from("profiles")
    .select("id, name, display_id, avatar_url, user_no")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  // 行が無い場合は最小オブジェクトで返す（RLSでinsert不可の環境でも落ちないように）
  let item =
    row ??
    ({
      id: user.id,
      name: null,
      display_id: null,
      avatar_url: null,
      user_no: null,
    } as const);

  // user_no が未設定なら生成して保存を試みる（失敗してもレスポンスは返す）
  if (!item.user_no) {
    const newNo = genUserNo(user.id);
    try {
      const { error: upErr } = await sb
        .from("profiles")
        .update({ user_no: newNo })
        .eq("id", user.id);
      if (!upErr) {
        item = { ...item, user_no: newNo };
      }
    } catch {
      // RLS などで失敗しても無視（フロントは user_no=null でも動く）
    }
  }

  return NextResponse.json(
    { ok: true, item },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}
