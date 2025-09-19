// app/api/daily/question/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Choice = { key: EV; label: string };
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const SCOPE_HINT: Record<Scope, string> = {
  WORK:   "仕事・学び・成果・チーム連携・自己効率",
  LOVE:   "恋愛・対人関係・信頼・距離感・感情のやり取り",
  FUTURE: "将来・目標・計画・成長・可能性の可視化",
  LIFE:   "生活全般・習慣・健康・心身の整え・日々の選択",
};

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
  const url = req.nextUrl;
  const slot = getSlot();
  const n = needCount(slot);
  const seed = Date.now();
  const debug = url.searchParams.get("debug") === "1";

  // ★ 新: scope（テーマ）を受け取る。未指定は LIFE
  const scope = (url.searchParams.get("scope")?.toUpperCase() as Scope) || "LIFE";
  const scopeHint = SCOPE_HINT[scope] ?? SCOPE_HINT.LIFE;

  let question = "今の流れを一歩進めるなら、どの感覚が近い？";
  let choices: Choice[] = [];
  let source: "ai" | "fallback" = "fallback";

  try {
    const oa = getOpenAI();

    const sys = `あなたはE/V/Λ/Ǝの4軸に対応する短い選択肢を生成する役割です。
必ず 次のJSONだけ を返す: {"question":"...","choices":[{"key":"E","label":"..."}, ...]}
厳守事項:
- key は "E","V","Λ","Ǝ" のいずれか
- label は12〜18文字の自然な日本語。重複禁止
- 各keyのlabelは必ず次の意味領域に一致:
  - E = 衝動・情熱・行動
  - V = 可能性・夢・理想
  - Λ = 選択・葛藤・決断
  - Ǝ = 観測・静寂・受容
- 日本語のみ。JSON以外の文字は出さない`;

    const usr = `デイリー診断の設問を1問だけ生成する。
前提テーマ(scope): ${scope}（文脈: ${scopeHint}）
時間帯: ${slot}（必要な選択肢:${n}）
制約:
- questionは1文・20文字前後・落ち着いた短文
- 選択肢はE/V/Λ/Ǝから${n}個だけ（テーマの文脈に寄せた表現にする）
- keyとlabelの意味は一致させる
seed:${seed}`;

    const res = await oa.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_output_tokens: 300,
      input: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    });

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
        .map((c: any) => ({ key: c.key as EV, label: (c.label as string).trim() }))
        .filter(
          (c, i, arr) =>
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
    scope,                 // ★ 追加
    seed,
    source,
    question_id: `daily-${new Date().toISOString().slice(0, 10)}-${slot}-${scope}`,
    ...(debug ? { debug: { envHasKey: !!process.env.OPENAI_API_KEY } } : {}),
  });
}
