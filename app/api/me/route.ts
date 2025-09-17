// app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  // 👇 DBの実カラムが user_id ならこちらに合わせる
  const { data, error } = await supabase
    .from("profiles")
    .select("id_no, id_no_str")
    .eq("user_id", user.id)   // ← id ではなく user_id を使う
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: user.id,
    idNo: data?.id_no ?? null,
    idNoStr: data?.id_no_str ?? null,
  });
}
