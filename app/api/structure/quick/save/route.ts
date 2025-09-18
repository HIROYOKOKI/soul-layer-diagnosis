// app/api/structure/quick/save/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // ログインユーザー取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    // リクエストボディ
    const body = (await req.json()) as {
      typeKey: "EVΛƎ" | "EΛVƎ";
      typeLabel: string;
      order: EV[];
      points: Record<EV, number>;
      comment: string;
      advice: string;
      theme?: "dev" | "prod";
    };

    // 必須チェック
    if (!body?.typeKey || !body?.typeLabel) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    // 保存
    const { error } = await supabase.from("quick_results").insert({
      user_id: user.id,
      type_key: body.typeKey,
      type_label: body.typeLabel,
      order_v2: body.order,
      points_v2: body.points,
      comment: body.comment,
      advice: body.advice,
      theme: body.theme ?? "dev",
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}

