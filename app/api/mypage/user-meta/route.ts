// app/api/mypage/user-meta/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genUserNo(userId: string) {
  const base = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `U-${base}`;
}

export async function GET(_req: NextRequest) {
  try {
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

    // ===== ベース（最小メタ） =====
    const emailLocal = (user.email ?? "").split("@")[0] || null;
    let item: {
      id: string;
      name: string | null;
      display_id: string | null;
      avatar_url: string | null;
      user_no: string | null;
    } = {
      id: user.id,
      name: null,
      display_id: null,
      avatar_url: null,
      user_no: null,
    };

    // ===== profiles から読めれば反映（RLS/行無しでも例外にしない） =====
    try {
      const { data: row } = await sb
        .from("profiles")
        .select("id, name, display_id, avatar_url, user_no")
        .eq("id", user.id)
        .maybeSingle();

      if (row) {
        item = {
          id: row.id ?? item.id,
          name: row.name ?? item.name,
          display_id: row.display_id ?? item.display_id,
          avatar_url: row.avatar_url ?? item.avatar_url,
          user_no: row.user_no ?? item.user_no,
        };
      }
    } catch {
      /* noop */
    }

    // ===== フィールド補完（name / user_no） =====
    // name: profiles → auth.user_metadata.name → email ローカル部
    if (!item.name) {
      const metaName = (user.user_metadata as any)?.name ?? null;
      item.name = metaName ?? emailLocal;
    }

    // user_no が無ければ計算
    if (!item.user_no) {
      item.user_no = genUserNo(user.id);
    }

    // ===== 可能なら保存（upsert / RLS で失敗しても無視） =====
    try {
      await sb.from("profiles").upsert(
        {
          id: user.id,
          name: item.name,
          display_id: item.display_id,
          avatar_url: item.avatar_url,
          user_no: item.user_no,
        },
        { onConflict: "id" }
      );
    } catch {
      /* noop */
    }

    return NextResponse.json(
      { ok: true, item },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unexpected_error" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
