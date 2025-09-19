// app/api/daily/question/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Choice = { key: EV; label: string };
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const SCOPE_COOKIE = "sl_scope";
const SCOPE_HINT: Record<Scope, string> = {
  WORK:   "仕事・学び・成果・チーム連携・自己効率に関する文脈で書く",
  LOVE:   "恋愛・信頼・距離感・関係性の深め方に関する文脈で書く",
  FUTURE: "将来・目標・計画・進路の意思決定に関する文脈で書く",
  LIFE:   "生活リズム・習慣・心身の整え・日々の選択に関する文脈で書く",
};

const FALLBACK: Choice[] = [
  { key: "E", label: "勢いで踏み出す" },
  { key: "V", label: "理想を描いて進む" },
  { key: "Λ", label: "条件を決めて選ぶ" },
  { key: "Ǝ", label: "一拍置いて観測する" },
];

function getSlot(): "morning" | "noon" | "night" {
  const j = (new Date().getUTCHours() + 9) % 24;
  if (j < 11) return "morning";
  if (j < 17) return "noon";
  return "night";
}
function needCount(slot: "morning" | "noon" | "night") {
  return slot === "morning" ? 4 : slot === "noon" ? 3 : 2;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const slot = getSlot();
  const n = needCount(slot);
  const seed = Date.now();
  const debug = url.searchParams.get("debug") === "1";

  // 1) scopeの決定: クエリ > Cookie > LIFE
  const qScope = url.searchParams.get("scope")?.toUpperCase();
  const cScope = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope = (["WORK","LOVE","FUTURE","LIFE"] as const).includes(qScope as any)
    ? (qScope as Scope)
    : (["WORK","LOVE","FUTURE","LIFE"] as const).includes(cScope as any)
      ? (cScope as Scope)
      : "LIFE";

  let question = "今の流れを一歩進めるなら、どの感覚が近い？";
  let choices: Choice[] = [];
  let source: "ai" | "fallback" = "fallback";

  try {
    const oa = getOpenAI();
    const sys = `あなたはE/V/Λ/Ǝの4軸に対応する短い選択肢を生成する役割です。
必ず 次のJSONだけ を返す: {"question":"...","choices":[{"key":"E","label":"..."}, ...]}
厳守:
- key は "E","V","Λ","Ǝ"
- label は12〜18文字の自然な日本語、重複禁止
- 各keyの意味:
  - E=衝動・情熱・行動
  - V=可能性・夢・理想
  - Λ=選択・葛藤・決断
  - Ǝ=観測・静寂・受容
- JSON以外の文字は出さない`;

    const usr = `デイリー診断の設問を1問だけ生成する。
前提テーマ(scope): ${scope}
テーマ文脈: ${SCOPE_HINT[scope]}
時間帯: ${slot}（必要な選択肢:${n}）
制約:
- questionは1文・20文字前後・落ち着いた短文
- 選択肢はE/V/Λ/Ǝから${n}個だけ（テーマ文脈に寄せた表現にする）
seed:${seed}`;

    const res = await oa.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_output_tokens: 300,
      input: [{ role: "system", content: sys }, { role: "user", content: usr }],
    });

    let raw = (res as any).output_text || "";
    if (!raw && (res as any)?.output?.[0]?.content?.[0]?.text) {
      raw = (res as any).output[0].content[0].text;
    }

    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}$/)?.[0] || "{}");
    if (parsed?.question && Array.isArray(parsed?.choices)) {
      question = String(parsed.question);
      choices = (parsed.choices as any[])
        .filter(c => c && typeof c.key === "string" && typeof c.label === "string")
        .map(c => ({ key: c.key as EV, label: (c.label as string).trim() }))
        .filter((c, i, arr) =>
          ["E","V","Λ","Ǝ"].includes(c.key) &&
          arr.findIndex(x => x.key === c.key) === i
        )
        .slice(0, n);
      if (choices.length) source = "ai";
    }
  } catch (e: any) {
    console.error("[/api/daily/question] OpenAI error:", e?.message ?? e);
  }

  if (!choices.length) {
    const used = new Set<string>();
    for (const c of FALLBACK) {
      if (choices.length >= n) break;
      if (!used.has(c.key)) { used.add(c.key); choices.push(c); }
    }
    source = "fallback";
  }

  return NextResponse.json({
    ok: true,
    question,
    choices,
    subset: choices.map(c => c.key),
    slot,
    scope,                                            // ← 明示的に返す
    seed,
    source,
    question_id: `daily-${new Date().toISOString().slice(0,10)}-${slot}-${scope}`, // ← idにもscope
    ...(debug ? { debug: { envHasKey: !!process.env.OPENAI_API_KEY } } : {}),
  });
}
