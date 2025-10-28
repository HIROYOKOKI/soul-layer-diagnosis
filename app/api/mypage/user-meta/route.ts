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

    // profiles 行の有無に依らず“必ず”最小メタを返す
    let baseItem = {
      id: user.id,
      name: (user.user_metadata as any)?.name ?? null,
      display_id: (user.user_metadata as any)?.display_id ?? null,
      avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
      user_no: null as string | null,
    };

    // RLS/行無しでも例外にしない安全読み
    try {
      const { data: row } = await sb
        .from("profiles")
        .select("id, name, display_id, avatar_url, user_no")
        .eq("id", user.id)
        .maybeSingle();

      if (row) {
        baseItem = {
          id: row.id ?? baseItem.id,
          name: row.name ?? baseItem.name,
          display_id: row.display_id ?? baseItem.display_id,
          avatar_url: row.avatar_url ?? baseItem.avatar_url,
          user_no: row.user_no ?? baseItem.user_no,
        };
      }
    } catch {
      // 権限NGでも握りつぶす
    }

    // user_no が無ければ計算して“返す”（保存はベストエフォート）
    if (!baseItem.user_no) {
      const computed = genUserNo(user.id);
      baseItem.user_no = computed;
      // 保存は試すだけ（失敗してもOK）
      try {
        await sb.from("profiles").update({ user_no: computed }).eq("id", user.id);
      } catch {/* noop */}
    }

    return NextResponse.json(
      { ok: true, item: baseItem },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    // ここまで来ることは稀。絶対500を返さない方針でもよいが、
    // デバッグのためメッセージは返す。
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unexpected_error" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
