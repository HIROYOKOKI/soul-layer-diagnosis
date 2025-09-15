// app/api/daily/question/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Choice = { key: EV; label: string };

const FALLBACK: Choice[] = [
  { key: "E", label: "勢いで踏み出す" },
  { key: "V", label: "理想を描いて進む" },
  { key: "Λ", label: "条件を決めて選ぶ" },
  { key: "Ǝ", label: "一拍置いて観測する" },
];

// --- 日本時間の現在時刻でスロットを決定 ---
function getJstDate() {
  const now = new Date();
  // JST (UTC+9) に補正
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst;
}

function getSlot(): "morning" | "noon" | "night" {
  const h = getJstDate().getUTCHours(); // JST基準の時
  if (h < 11) return "morning";
  if (h < 17) return "noon";
  return "night";
}

function needCount(slot: "morning" | "noon" | "night") {
  return slot === "morning" ? 4 : slot === "noon" ? 3 : 2;
}

export async function GET(_req: NextRequest) {
  // ★ 共通パッチ：cookies() を await（Supabase未使用でも最初に揃える）
  const _jar = await cookies();

  const slot = getSlot();
  const n = needCount(slot);
  const seed = Date.now();
  let question = "今の流れを一歩進めるなら、どの感覚が近い？";
  let choices: Choice[] = [];

  try {
    const oa = getOpenAI();
    const sys = `あなたはE/V/Λ/Ǝの4軸から短い選択肢を作る生成器です。
- 必ず JSON で返す: {"question": "...", "choices":[{"key":"E","label":"..."},...]}
- key は "E","V","Λ","Ǝ" のいずれか。label は12文字前後の日本語。重複禁止。`;
    const usr = `時間帯: ${slot}（必要な選択肢の数: ${n}）
テーマ: デイリー診断の設問を1問だけ。
制約:
- questionは1文・20文字前後
- 選択肢はE/V/Λ/Ǝから${n}個だけ選んで出す（不足分は除外して良い）
- トーンは落ち着いた短文
seed:${seed}`;

    const res = await oa.responses.create({
  model: "gpt-5-mini",
  temperature: 0.6,
  max_output_tokens: 300,
  input: [
    { role: "system", content: sys },
    { role: "user", content: usr },
  ],
});
