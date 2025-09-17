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

// 日本時間スロット判定（朝/昼/夜）
function getSlot(): "morning" | "noon" | "night" {
  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  if (jstHour < 11) return "morning";
  if (jstHour < 17) return "noon";
  return "night";
}
function needCount(slot: "morning" | "noon" | "night") {
  return slot === "morning" ? 4 : slot === "noon" ? 3 : 2;
}

export async function GET(_req: NextRequest) {
  const slot = getSlot();
  const n = needCount(slot);
  const seed = Date.now();

  let question = "今の流れを一歩進めるなら、どの感覚が近い？";
  let choices: Choice[] = [];

  try {
    const oa = getOpenAI();
    const sys = `あなたはE/V/Λ/Ǝの4軸から短い選択肢を作る生成器です。
必ず JSON で返す: {"question":"...","choices":[{"key":"E","label":"..."},...]}
key は "E","V","Λ","Ǝ"。label は12〜18文字程度の自然な日本語。重複禁止。`;
    const usr = `時間帯: ${slot}（必要な選択肢の数: ${n}）
テーマ: デイリー診断の設問を1問だけ。
制約:
- questionは1文・20文字前後
- 選択肢はE/V/Λ/Ǝから${n}個だけ出す（不足分は除外して良い）
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

    // —— 応答のテキストを頑丈に取り出す
    let raw = "";
    // SDKの output_text
    // @ts-ignore
    if (typeof (res as any)?.output_text === "string") raw = (res as any).output_text;
    // content[].text 形式
    // @ts-ignore
    else if ((res as any)?.output?.[0]?.content?.[0]?.text) {
      // @ts-ignore
      raw = (res as any).output[0].content[0].text;
    } else {
      raw = JSON.stringify(res);
    }

    // 余分な前後文字を除いて JSON を抽出
    const m = raw.match(/\{[\s\S]*\}$/);
    const jsonText = m ? m[0] : raw;
    const parsed = JSON.parse(jsonText);

    if (parsed?.question && Array.isArray(parsed?.choices)) {
      question = String(parsed.question);
      choices = parsed.choices
        .filter((c: any) => c && typeof c.key === "string" && typeof c.label === "string")
        .map((c: any) => ({ key: c.key as EV, label: c.label as string }))
        // n個に整形・重複除去
        .filter(
          (c, i, arr) =>
            ["E", "V", "Λ", "Ǝ"].includes(c.key) &&
            arr.findIndex((x) => x.key === c.key) === i
        )
        .slice(0, n);
    }
  } catch (e: any) {
    // 生成失敗時は後段のフォールバックに任せる
    // ここでログを仕込みたい場合は console.error(e) 程度でOK（VercelのFunctionsログに出ます）
  }

  // フォールバック（不足分はFALLBACKから補完）
  if (!choices.length) {
    choices = FALLBACK.slice(0, n);
  } else if (choices.length < n) {
    const used = new Set(choices.map((c) => c.key));
    for (const c of FALLBACK) {
      if (choices.length >= n) break;
      if (!used.has(c.key)) choices.push(c);
    }
  }

  return NextResponse.json({
    ok: true,
    question,
    choices,
    subset: choices.map((c) => c.key), // その回で出したコード
    slot,
    seed,
    question_id: `daily-${new Date().toISOString().slice(0, 10)}-${slot}`,
  });
}
