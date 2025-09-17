 // app/api/me/route.ts
 import { NextResponse } from "next/server";
 import { cookies } from "next/headers";
 import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

 export async function GET() {
   const supabase = createRouteHandlerClient({ cookies });

   // セッションの本人
   const {
     data: { user },
     error: userError,
   } = await supabase.auth.getUser();

   if (userError || !user) {
     return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
   }


 // 本人の profiles 行を取得（id ベース）
  const { data, error } = await supabase
    .from("profiles")
    .select("id_no, id_no_str")
    .eq("id", user.id)
    .maybeSingle();

   if (error) {
     return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
   }

   // プロフィール未作成でも安全に返す
   return NextResponse.json({
     ok: true,
     id: user.id,                               // 内部 UUID（auth.users.id）
     idNo: data?.id_no ?? null,                 // 連番
     idNoStr: data?.id_no_str ?? null,          // "0001" 形式
   // UIでは使わないため email/name/plan は返さない（必要になったらDBに列を追加してから）
   });
 }
