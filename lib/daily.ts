// lib/daily.ts
export type EV = "E" | "V" | "Λ" | "Ǝ";
export type Slot = 1 | 2 | 3;

export const TZ = "Asia/Tokyo";

export function getSlot(d = new Date()): Slot {
  // 朝=04:00-11:59 / 昼=12:00-17:59 / 夜=18:00-03:59
  const jst = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const h = jst.getHours();
  if (h >= 4 && h < 12) return 1;
  if (h >= 12 && h < 18) return 2;
  return 3;
}

export function buildQuestionId(date = new Date(), slot: Slot = getSlot(date)) {
  const jst = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, "0");
  const dd = String(jst.getDate()).padStart(2, "0");
  return `daily-${yyyy}-${mm}-${dd}-${slot}` as const;
}

export type DailyOption = { key: EV; label: string };
export type DailyQuestion = {
  id: string;
  slot: Slot;
  text: string;
  options: DailyOption[];
  subset?: EV[]; // 2〜3択に縮約するとき
};
