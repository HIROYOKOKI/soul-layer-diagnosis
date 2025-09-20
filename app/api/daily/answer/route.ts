// app/api/daily/answer/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  detectJstSlot, extractE, generateCandidates, choose,
  observeTemplate, nextV, toUiProd
} from "@/lib/evla";
import type {
  DailyAnswerRequest, DailyAnswerResponse, Slot, Theme, EvlaLog
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];

/** theme 解決（body > query > cookie > WORK） */
function pickTheme(req: NextRequest, bodyTheme?: Theme): Theme {
  const q = req.nextUrl.searchParams.get("theme")?.toUpperCase() as Theme | null;
  if (bodyTheme && THEMES.includes(bodyTheme)) return bodyTheme;
  if (q && THEMES.includes(q)) return q;
  const c = cookies().get("ev_theme")?.value?.toUpperCase() as Theme | undefined;
  return (c && THEMES.includes(c)) ? c : "WORK";
}

/** 失敗時に少し待って再試行（ネットワーク短期エラー対策） */
async function insertWithRetry(sb: any, row: any, n = 2) {
  let last: any;
  for (let i = 0; i <= n; i++) {
    const { error } = await sb.from("daily_results").insert(row);
    if (!error) return;
    last = error;
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  throw last;
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

    // 本番UI：USE_OPENAI=true でGPT、失敗時テンプレにフォールバック
    const ui = await toUiProd(evla);

    // Supabase 保存（DBの theme は enum/text の小文字想定）
    const sb = getSupabaseAdmin();
    if (!sb) {
      const res: DailyAnswerResponse = { ok: false, error: "supabase_env_missing" };
      return NextResponse.json(res, { status: 500 });
    }

    const themeDb = theme.toLowerCase(); // "WORK" -> "work"

    try {
      await insertWithRetry(sb, {
        slot,
        score: ui.score,
        comment: ui.comment,
        advice: ui.advice,
        affirm: ui.affirm,
        theme: themeDb as any,
        evla, // JSONB
      });
    } catch (e: any) {
      console.error("[/api/daily/answer] insert failed:", e?.message || e);
      const res: DailyAnswerResponse = { ok: false, error: e?.message ?? "insert_failed" };
      return NextResponse.json(res, { status: 500 });
    }

    const res: DailyAnswerResponse = { ok: true, ...ui };
    return NextResponse.json(res);
  } catch (e: any) {
    console.error("[/api/daily/answer] unhandled:", e);
    const res: DailyAnswerResponse = { ok: false, error: e?.message ?? "unknown_error" };
    return NextResponse.json(res, { status: 500 });
  }
}
