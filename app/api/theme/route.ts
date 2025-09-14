// app/api/theme/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ theme: z.string().min(1) });

export async function POST(req: NextRequest) {
  // ★ 共通パッチ：cookies() を await、関数で渡す
  const jar = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => jar });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const theme = parsed.data.theme;

  try {
    // 1) DBへ反映（profiles.theme が無ければ後述のSQLを実行）
    const { error } = await supabase.from("profiles").upsert({ id: user.id, theme });
    if (error) throw error;

    // 2) CookieもDBと揃える（UIのズレ防止）
    const res = NextResponse.json({ ok: true, theme });
    res.cookies.set("theme", theme, { path: "/", sameSite: "lax", httpOnly: false });
    res.cookies.set("theme_set_at", new Date().toISOString(), { path: "/", sameSite: "lax", httpOnly: false });
    return res;
  } catch (e: any) {
    console.error("theme.update.fail", { userId: user.id, message: e?.message });
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
