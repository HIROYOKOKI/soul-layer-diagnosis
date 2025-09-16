// app/api/theme/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Env = "dev" | "prod";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const to: Env | undefined = body?.to;
    if (to !== "dev" && to !== "prod") {
      return NextResponse.json(
        { ok: false, error: "invalid_to_param", hint: 'to must be "dev" or "prod"' },
        { status: 400 }
      );
    }

    // ← 認証チェックは一切しない。Cookie を書くだけ
    cookies().set("theme", to, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,   // フロントからも読めるように
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ ok: true, theme: to });
  } catch (e: any) {
    console.error("[/api/theme] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
