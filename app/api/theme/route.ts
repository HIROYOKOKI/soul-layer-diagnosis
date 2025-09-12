// app/api/theme/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ theme: z.string().min(1) });

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const theme = parsed.data.theme;

  try {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, theme });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("theme.update.fail", { userId: user.id, message: e?.message });
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
