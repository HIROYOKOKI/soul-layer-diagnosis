// /app/api/daily/answer/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSlot, buildQuestionId, type EV } from "@/lib/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 受信ペイロード検証
const schema = z.object({
  id: z.string(), // 受けるが信用しない（サーバーで再計算）
  first_choice: z.enum(["E", "V", "Λ", "Ǝ"]).nullable().optional(),
  final_choice: z.enum(["E", "V", "Λ", "Ǝ"]),
  changes: z.number().int().min(0).optional().default(0),
  subset: z.array(z.enum(["E", "V", "Λ", "Ǝ"])).nullable().optional(),
  theme: z.string().optional().default("self"),
});

// スコア算出（シンプル・ヒューリスティクス）
// final を主点に +1、first が存在し異なる場合は +0.3 を与えて「揺れ」を記録
function scoreFromChoices(finalChoice: EV, firstChoice: EV | null) {
  const base: Record<EV, number> = { E: 0, V: 0, "Λ": 0, "Ǝ": 0 };
  base[finalChoice] += 1;
  if (firstChoice && firstChoice !== finalChoice) base[firstChoice] += 0.3;
  return base;
}

// コメント & アファメーション（軽量版）
function buildCopy(finalChoice: EV) {
  switch (finalChoice) {
    case "E":
      return {
        c: "意志を一点に。小さな確定が今日を動かす。",
        a: "選んだ一歩が、次の地図になる。",
      };
    case "V":
      return {
        c: "感受を開き、流れに耳を澄ます。",
        a: "感じた方向が、あなたの北極星。",
      };
    case "Λ":
      return {
        c: "要素を束ね、形に落とす時間。",
        a: "点は線に、線は軌跡に。",
      };
    case "Ǝ":
      return {
        c: "前提を反転。見え方が変われば、選択も変わる。",
        a: "裏側に、次の入口がある。",
      };
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { id: clientId, first_choice, final_choice, changes, subset, theme } = parsed.data;

  // サーバーで slot と question_id を再計算（改竄対策）
  const slot = getSlot();
  const question_id = buildQuestionId(new Date(), slot);

  // スコア整形（JSONB互換のプレーンオブジェクト）
  const s = scoreFromChoices(final_choice as EV, (first_choice as EV | null) ?? null);
  const scores = { E: s.E, V: s.V, "Λ": s["Λ"], "Ǝ": s["Ǝ"] };

  const { c: comment, a: affirmation } = buildCopy(final_choice as EV);

  try {
    const { data, error } = await supabase
      .from("daily_results")
      .upsert(
        {
          user_id: user.id,
          question_id, // サーバー計算値を正とする
          env: "prod",
          theme, // テーブルにカラムがある前提（無ければ削除してください）
          code: final_choice,
          scores,
          raw_interactions: {
            first_choice: first_choice ?? null,
            final_choice,
            changes: changes ?? 0,
            subset: subset ?? null,
            slot,
            client_id: clientId ?? null, // 参考ログとして保持（任意）
          },
          comment,
          quote: affirmation,
          weight: 0.1,
        },
        { onConflict: "user_id,question_id,env" }
      )
      .select()
      .single();

    if (error) {
      console.error("daily.answer.persist_failed", {
        userId: user.id,
        question_id,
        message: error.message,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 通算回数でマイルストーン検出
    const { count, error: countError } = await supabase
      .from("daily_results")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("env", "prod");

    if (countError) {
      console.error("daily.answer.count_failed", {
        userId: user.id,
        question_id,
        message: countError.message,
      });
    }

    const milestone = [10, 30, 90].find((n) => (count ?? 0) === n) ?? null;

    return NextResponse.json({ ok: true, item: data, milestone });
  } catch (e) {
    console.error("daily.answer.fail", {
      userId: user.id,
      question_id,
      message: (e as Error).message,
    });
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
