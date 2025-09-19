// app/api/daily/question/route.ts
import { NextResponse, type NextRequest } from "next/server";
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

function getSlot(): "morning" | "noon" | "night" {
  const jstHour = (new Date().getUTCHours() + 9) % 24;
  if (jstHour < 11) return "morning";
  if (jstHour < 17) return "noon";
  return "night";
}
function needCount(slot: "morning" | "noon" | "night") {
  return slot === "morning" ? 4 : slot === "noon" ? 3 : 2;
}

export async function GET(req: NextRequest) {
  const slot = getSlot();
  const n = needCount(slot);
  const seed = Date.now();
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  let question = "今の流れを一歩進めるなら、どの感覚が近い？";
  let choices: Choice[] = [];
  let source: "ai" | "fallback" = "fallback";

  try {
    const oa = getOpenAI();
    const sys = `あなたはE/V/Λ/Ǝの4軸から短い選択肢を作る生成器です。
必ず JSON で返す: {"question":"...","choices":[{"key":"E","label":"..."},...]}
keyは"E","V","Λ","Ǝ"。labelは12〜18文字の自然な日本語。重複禁止。`;
    const usr = `時間帯:${slot}（必要な選択肢:${n}）
テーマ: デイリー診断の設問を1問だけ。
制約:
- questionは1文・20文字前後
- 選択肢はE/V/Λ/Ǝから${n}個だけ
- トーンは落ち着いた短文
seed:${seed}`;

    const res = await oa.responses.create({
      model: "gpt-4o-mini",            // ★ まずは通りやすいモデルで確認
      temperature: 0.6,
      max_output_tokens: 300,
      input: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    });

    // --- 応答の取り出し ---
    let raw = "";
    // @ts-ignore
    if (typeof (res as any)?.output_text === "string") raw = (res as any).output_text;
    // @ts-ignore
    else if ((res as any)?.output?.[0]?.content?.[0]?.text) {
      // @ts-ignore
      raw = (res as any).output[0].content[0].text;
    } else {
      raw = JSON.stringify(res);
    }

    const m = raw.match(/\{[\s\S]*\}$/);
    const jsonText = m ? m[0] : raw;
    const parsed = JSON.parse(jsonText);

    if (parsed?.question && Array.isArray(parsed?.choices)) {
      question = String(parsed.question);
      choices = parsed.choices
        .filter((c: any) => c && typeof c.key === "string" && typeof c.label === "string")
        .map((c: any) => ({ key: c.key as EV, label: c.label as string }))
        .filter((c, i, arr) =>
          ["E", "V", "Λ", "Ǝ"].includes(c.key) &&
          arr.findIndex((x) => x.key === c.key) === i
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
      if (!used.has(c.key)) {
        used.add(c.key);
        choices.push(c);
      }
    }
    source = "fallback";
  }

  return NextResponse.json({
    ok: true,
    question,
    choices,
    subset: choices.map((c) => c.key),
    slot,
    seed,
    source,                                // ★ 追加：UIで確認しやすく
    question_id: `daily-${new Date().toISOString().slice(0, 10)}-${slot}`,
    ...(debug ? { debug: { envHasKey: !!process.env.OPENAI_API_KEY } } : {}),
  });
}
