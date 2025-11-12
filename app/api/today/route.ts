// app/api/today/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function hourByIntl(): number {
  try {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find(p => p.type === "hour")?.value ?? "0";
    return parseInt(h, 10);
  } catch { return NaN; }
}
function hourByAdd9(): number {
  return new Date(Date.now() + 9*60*60*1000).getUTCHours();
}
function toSlot(h: number): "morning"|"noon"|"night" {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}
export async function GET() {
  const hIntl = hourByIntl();
  const hourJST = Number.isNaN(hIntl) ? hourByAdd9() : hIntl;
  const slot = toSlot(hourJST);
  return NextResponse.json({ ok:true, slot, hourJST, serverNowISO:new Date().toISOString() },
    { headers: { "cache-control": "no-store" } });
}
