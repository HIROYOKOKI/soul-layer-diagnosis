// _utils/modelMeta.ts に追記
export type DailySlot = "morning" | "noon" | "night";

export function getJstHour(): number {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find(p => p.type === "hour")?.value ?? "0";
  return parseInt(hourStr, 10);
}
export function slotByHourJST(h: number): DailySlot {
  if (h >= 5 && h < 11) return "morning"; // 05:00-10:59
  if (h >= 11 && h < 17) return "noon";   // 11:00-16:59
  return "night";                          // 17:00-04:59
}
export function getTodayDailySlotJST(): DailySlot {
  return slotByHourJST(getJstHour());
}
