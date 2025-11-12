// app/api/today/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Intl（優先）でJSTのhour取得
function hourByIntl(): number {
  try {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find(p => p.type === "hour")?.value ?? "0";
    return parseInt(h, 10);
  } catch {
    return NaN;
  }
}

// フォールバック：UTCに+9h
function hourByAdd9(): number {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours();
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

  return NextResponse.json(
    {
      ok: true,
      slot,
      hourJST,
      serverNowISO: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
