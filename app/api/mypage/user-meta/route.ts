import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genUserNo(userId: string) {
  const base = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `U-${base}`;
}

export async function GET(_req: NextRequest) {
  try {
    const sb = createSupabaseServerClient();
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { ok: true, item: null, unauthenticated: true },
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    const emailLocal = (user.email ?? "").split("@")[0] || null;

    // 1) profiles から読む（失敗無視）
    let prof: any = null;
    try {
      const { data: row } = await sb
        .from("profiles")
        .select("id, name, display_id, avatar_url, user_no")
        .eq("id", user.id)
        .maybeSingle();
      prof = row ?? null;
    } catch {
      /* noop */
    }

    // 2) 最新の profile_results から name を拾う（失敗無視）
    let latestProfileName: string | null = null;
    try {
      const { data: pr } = await sb
        .from("profile_results")
        .select("name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      latestProfileName = pr?.name ?? null;
    } catch {
      /* noop */
    }

    // 3) マージとフォールバック
    const item = {
      id: prof?.id ?? user.id,
      name:
        prof?.name ??
        latestProfileName ??
        (user.user_metadata as any)?.name ??
        emailLocal,
      display_id: prof?.display_id ?? null,
      avatar_url: prof?.avatar_url ?? null,
      user_no: prof?.user_no ?? genUserNo(user.id),
    };

    // 4) 可能なら profiles を upsert（RLSで失敗しても無視）
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
