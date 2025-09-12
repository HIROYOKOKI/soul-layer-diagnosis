// app/api/daily/question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { getSlot } from "@/lib/daily";
import { generateQuestion, fallbackQuestion } from "@/lib/question-gen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // まずは Cookie で試す
  const helper = createRouteHandlerClient({ cookies });
  let { data: { user } } = await helper.auth.getUser();

  // Cookie で取れない場合は Authorization: Bearer で認証
  if (!user) {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (token) {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const r = await sb.auth.getUser(token);
      user = r.data.user ?? null;
    }
  }

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slot = getSlot();
  try {
    const item = (await generateQuestion(user.id, slot)) ?? fallbackQuestion(slot);
    return NextResponse.json(item);
  } catch (e: any) {
    console.error("daily.question.fail", { userId: user.id, slot, message: e.message });
    return NextResponse.json(fallbackQuestion(slot));
  }
}
