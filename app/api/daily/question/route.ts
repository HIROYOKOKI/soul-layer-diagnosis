// app/api/daily/question/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
// 👇 名前空間importに変更
import * as EVLA from "@/lib/evla";
import type { DailyQuestionResponse, Slot, Theme } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_scope";

/** theme 解決（query > cookie > LIFE） */
function getThemeFromCookieOrQuery(req: NextRequest): Theme {
  const q = req.nextUrl.searchParams.get("theme")?.toUpperCase() as Theme | null;
  if (q && THEMES.includes(q)) return q;
  const c = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase() as Theme | undefined;
  return c && THEMES.includes(c) ? c : "LIFE";
}

function makeSeed(slot: Slot) {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  return Number(`${ymd}${slot === "morning" ? "1" : slot === "noon" ? "2" : "3"}`);
}

export async function GET(req: NextRequest) {
  try {
    const slot = (req.nextUrl.searchParams.get("slot") as Slot) || EVLA.detectJstSlot();
    const theme = getThemeFromCookieOrQuery(req);
    const seed = makeSeed(slot);

    // 質問テンプレ
    const qMorning = [
      "今日の一歩を決めるなら、いまの衝動に一番近いのは？",
      "今朝の最初の選択、どの動きがしっくり来ますか？",
    ];
    const qNoon = [
      "午後、流れを強めるために寄せたい意識は？",
      "この時間、集中を高めるならどれを選びますか？",
    ];
    const qNight = [
      "一日を締める小さな完了はどれ？",
      "今日を軽く終えるための一手は？",
    ];
    const question =
      slot === "morning"
        ? EVLA.seededPick(qMorning, seed)
        : slot === "noon"
        ? EVLA.seededPick(qNoon, seed)
        : EVLA.seededPick(qNight, seed);

    // 選択肢（slot別）
    const choices =
      slot === "morning"
        ? [
            { id: "A", label: "５分だけ着手" },
            { id: "B", label: "阻害要因を１つ除去" },
            { id: "C", label: "関係者に一言共有" },
            { id: "D", label: "見積もりを更新" },
          ]
        : slot === "noon"
        ? [
            { id: "A", label: "一点に集中" },
            { id: "B", label: "優先順位を再確認" },
            { id: "C", label: "途中経過を共有" },
          ]
        : [
            { id: "A", label: "短い完了を置く" },
            { id: "B", label: "明日の一手を予約" },
          ];

    const res: DailyQuestionResponse = { ok: true, seed, slot, theme, question, choices };
    return NextResponse.json(res);
  } catch (e: any) {
    const res: DailyQuestionResponse = { ok: false, error: e?.message ?? "unknown_error" };
    return NextResponse.json(res, { status: 500 });
  }
}
