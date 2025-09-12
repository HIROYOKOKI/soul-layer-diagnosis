export type EV = "E" | "V" | "Λ" | "Ǝ"

export function nowJst(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
}
export function getSlot(d = nowJst()): 1|2|3 {
  const h = d.getHours(); if (h < 12) return 1; if (h < 18) return 2; return 3
}
export function buildQuestionId(d = nowJst(), slot = getSlot(d)) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0")
  return `daily-${y}-${m}-${day}-${slot}`
}
export function scoreFromChoices(final_choice: EV, first_choice?: EV | null) {
  const s = { E: 0, V: 0, L: 0, Eexists: 0 }
  const key = (k: EV) => (k === "Λ" ? "L" : k === "Ǝ" ? "Eexists" : (k as "E"|"V"))
  s[key(final_choice)] = 1.0
  if (first_choice && first_choice !== final_choice) s[key(first_choice)] = 0.25
  return s
}
export function buildCopy(final_choice: EV) {
  const map: Record<EV,{c:string;a:string}> = {
    E:  { c:"情熱が火種となる日。小さな着火で十分。",   a:"私は火を点けて進む。" },
    V:  { c:"可能性の窓が開く。発想に翼を。",         a:"私は夢に具体を与える。" },
    Λ:  { c:"選択が形をつくる。輪郭が鮮明に。",        a:"私は基準を決めて進む。" },
    Ǝ:  { c:"観測が静けさを連れてくる。澄んだ判断。", a:"私は一拍おいて、確かめる。" },
  }
  return map[final_choice]
}
