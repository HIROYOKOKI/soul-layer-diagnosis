// app/api/theme/set/route.ts
import { NextResponse } from "next/server";
// TODO: Supabase 連携に差し替え
export async function POST(req: Request) {
  try {
    const { theme } = await req.json();
    if (!["work", "love", "future", "self"].includes(theme)) {
      return NextResponse.json({ ok: false, error: "invalid theme" }, { status: 400 });
    }
    // ここで Supabase に保存する処理を書く
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

