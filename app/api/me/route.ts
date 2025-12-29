import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // ✅ ログではなく「レスポンス用に」デバッグ情報を保持
    const debug = {
      supabaseType: typeof supabase,
      hasAuth: !!(supabase as any)?.auth,
      hasGetUser: !!(supabase as any)?.auth?.getUser,
      keysPresent: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    };

    // supabase.auth が無いならここで確定
    if (!debug.hasAuth || !debug.hasGetUser) {
      return NextResponse.json(
        { ok: false, error: "supabase_client_invalid", debug },
        { status: 500 }
      );
    }

    const { data, error } = await (supabase as any).auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated", detail: error?.message ?? null, debug },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user: data.user, debug });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "internal_error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
