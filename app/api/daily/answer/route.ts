// app/api/daily/answer/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// 👇 evla の関数は名前空間でまとめて import
import * as EVLA from "@/lib/evla";

import type {
  DailyAnswerRequest,
  DailyAnswerResponse,
  Slot,
  Theme,
  EvlaLog,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_scope";

/** theme 解決（body > query > cookie > LIFE） */
function pickTheme(req: NextRequest, bodyTheme?: Theme): Theme {
  const q = req.nextUrl.searchParams.get("theme")?.toUpperCase() as Theme | null;
  if (bodyTheme && THEMES.includes(bodyTheme)) return bodyTheme;
  if (q && THEMES.includes(q)) return q;

  const c = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase() as Theme | undefined;
  return c && THEMES.includes(c) ? c : "LIFE";
}

/** 失敗時に少し待って再試行（短期的なDBエラー対策） */
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
    const slot: Slot = payload.slot ?? EVLA.detectJstSlot();
    const theme: Theme = pickTheme(req, payload.theme);
    const choiceId = payload.choiceId;

    // EVΛƎループ
    const E = EVLA.extractE(slot, theme);
    const V = EVLA.generateCandidates(slot, theme);
    const LambdaAuto = EVLA.choose(E, V, slot);
    const Eps = EVLA.observeTemplate(LambdaAuto, V);
    const N = EVLA.nextV(Eps, LambdaAuto);

    // 保存用ログ
    const evla: EvlaLog = {
      slot,
      mode: "EVΛƎ",
      theme,
      E,
      V,
      Lambda: {
        ...LambdaAuto,
        reason: `${LambdaAuto.reason}（ユーザー選択=${choiceId}）`,
      },
      Epsilon: Eps,
      NextV: N,
    };

    // GPT or テンプレ
    const ui: any = await EVLA.toUiProd(evla);

    // Supabase 保存
    const sb = getSupabaseAdmin();
    if (!sb) {
      const res: DailyAnswerResponse = {
        ok: false,
        error: "supabase_env_missing",
      };
      return NextResponse.json(res, { status: 500 });
    }

    const themeDb = theme.toLowerCase();

    try {
      await insertWithRetry(sb, {
        slot,
        score: ui.score,
        comment: ui.comment,
        advice: ui.advice,
        affirm: ui.affirm,
        theme: themeDb as any,
        evla,
      });
    } catch (e: any) {
      console.error("[/api/daily/answer] insert failed:", e?.message || e);
      const res: DailyAnswerResponse = {
        ok: false,
        error: e?.message ?? "insert_failed",
      };
      return NextResponse.json(res, { status: 500 });
    }

    // --- デバッグ用ヘッダーで「gpt or template」を可視化 ---
    const res = NextResponse.json({
      ok: true,
      comment: ui.comment,
      advice: ui.advice,
      affirm: ui.affirm,
      score: ui.score,
    } satisfies DailyAnswerResponse);
    res.headers.set("x-ui-source", ui.__source ?? "unknown");
    return res;
  } catch (e: any) {
    console.error("[/api/daily/answer] unhandled:", e);
    const res: DailyAnswerResponse = {
      ok: false,
      error: e?.message ?? "unknown_error",
    };
    return NextResponse.json(res, { status: 500 });
  }
}
