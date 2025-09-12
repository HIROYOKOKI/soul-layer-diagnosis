// app/api/daily/question/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSlot } from "@/lib/daily";
import { generateQuestion, fallbackQuestion } from "@/lib/question-gen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slot = getSlot();
  try {
    const item = (await generateQuestion(user.id, slot)) ?? fallbackQuestion(slot);
    return NextResponse.json(item);
  } catch (e) {
    console.error("daily.question.fail", { userId: user.id, slot, error: (e as Error).message });
    return NextResponse.json(fallbackQuestion(slot));
  }
}
