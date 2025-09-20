// app/api/daily/answer/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  detectJstSlot, extractE, generateCandidates, choose,
  observeTemplate, nextV, toUi
} from "@/lib/evla";
import type {
  DailyAnswerRequest, DailyAnswerResponse, Slot, Theme, EvlaLog
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];

function pickTheme(req: NextRequest, bodyTheme?: Theme): Theme {
  const q = req.nextUrl.searchParams.get("theme")?.toUpperCase() as Theme | null;
  if (bodyTheme && THEMES.includes(bodyTheme)) return bodyTheme;
  if (q && THEMES.includes(q)) return q;
  const c = cookies().get("ev_theme")?.value?.toUpperCase() as Theme | undefined;
  return (c && THEMES.includes(c)) ? c : "WORK";
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as DailyAnswerRequest;
    const slot: Slot = payload.slot ?? detectJstSlot();
    const theme: Theme = pickTheme(req, payload.theme);
    const choiceId = payload.choiceId;

    // EVΛƎループ（E→V→Λ→Ǝ→NextV）
    const E = extractE(slot, theme);
    const V = generateCandidates(slot, theme);
    const LambdaAuto = choose(E, V, slot);
    const Eps = observeTemplate(LambdaAuto, V);
    const N = nextV(Eps, LambdaAuto);

    // 保存用ログ（上位は大文字Themeのまま）
    const evla: EvlaLog = {
      slot, mode: "EVΛƎ", theme,
      E, V,
      Lambda: { ...LambdaAuto, reason: `${LambdaAuto.reason}（ユーザー選択=${choiceId}）` },
      Epsilon: Eps,
      NextV: N,
    };

    // 返却UI（固定契約）
    const ui = toUi(evla);

    // Supabase 保存（DBは enum theme_key = 小文字想定のため小文字化）
    const sb = getSupabaseAdmin();
    if (!sb) {
      const res: DailyAnswerResponse = { ok: false, error: "supabase_env_missing" };
      return NextResponse.json(res, { status: 500 });
    }

    const themeDb = theme.toLowerCase(); // "WORK" -> "work"

    const { error } = await sb.from("daily_results").insert({
      slot,
      score: ui.score,
      comment: ui.comment,
      advice: ui.advice,
      affirm: ui.affirm,
      theme: themeDb as any, // enum/text どちらでも通すため any キャスト
      evla,                  // JSONB
    });

    if (error) {
      const res: DailyAnswerResponse = { ok: false, error: error.message };
      return NextResponse.json(res, { status: 500 });
    }

    const res: DailyAnswerResponse = { ok: true, ...ui };
    return NextResponse.json(res);
  } catch (e: any) {
    const res: DailyAnswerResponse = { ok: false, error: e?.message ?? "unknown_error" };
    return NextResponse.json(res, { status: 500 });
  }
}
