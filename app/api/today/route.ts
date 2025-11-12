// app/api/today/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// A. Intl（推奨）：ICUあり環境なら最も正確
function hourByIntl(): number {
  try {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === "hour")?.value ?? "0";
    return parseInt(h, 10);
  } catch {
    return NaN;
  }
}

// B. 手計算フォールバック：UTCに+9hしてUTC時を読む（ICUが無い環境でも動く）
function hourByAdd9(): number {
  const now = Date.now();
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  return jst.getUTCHours(); // 0-23
}

function toSlot(h: number): "morning" | "noon" | "night" {
  if (h >= 5 && h < 12) return "morning"; // 05:00-11:59
  if (h >= 12 && h < 18) return "noon";   // 12:00-17:59
  return "night";                          // 18:00-04:59
}

export async function GET() {
  const hIntl = hourByIntl();
  const hourJST = Number.isNaN(hIntl) ? hourByAdd9() : hIntl;
  const slot = toSlot(hourJST);

  // デバッグ用に両方式の値も返す（フロントは .slot だけ使えばOK）
  const debug = {
    hourIntl: Number.isNaN(hIntl) ? null : hIntl,
    hourAdd9: hourByAdd9(),
    serverNowISO: new Date().toISOString(),
  };

  return NextResponse.json(
    { ok: true, slot, hourJST, ...debug },
    { headers: { "cache-control": "no-store" } }
  );
}
