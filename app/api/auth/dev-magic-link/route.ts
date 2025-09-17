import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email, next = "/mypage" } = await req.json();
  if (!email) return NextResponse.json({ ok:false, error:"email_required" }, { status:400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // サーバー専用
  const sb = createClient(url, key);

  const { data, error } = await sb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://soul-layer-diagnosis.vercel.app"}/auth/callback?next=${encodeURIComponent(next)}` }
  });

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });
  // data.properties.action_link に有効なURLが入っています
  return NextResponse.json({ ok:true, action_link: data.properties.action_link });
}
