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

/** keyごとの意味に沿っているかをざっくり検査（最低限の保険） */
const MEANING_PATTERNS: Record<EV, RegExp[]> = {
  E: [/(衝動|勢い|行動|一歩|踏み出|動き|エネルギー)/],
  V: [/(可能性|理想|夢|未来|ビジョン|想像|描い)/],
  "Λ": [/(選択|決断|迷い|条件|取捨|葛藤|絞り)/],
  "Ǝ": [/(観測|静寂|落ち着|観察|見つめ|一拍|整える|受容)/],
};
function matchesMeaning(key: EV, label: string) {
  const pats = MEANING_PATTERNS[key];
  return pats.some((re) => re.test(label));
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

    // ★★★ 強化した system prompt（意味付けを厳密化） ★★★
    const sys = `あなたはE/V/Λ/Ǝの4軸に対応する短い選択肢を生成する役割です。
必ず 次のJSONだけ を返す: {"question":"...","choices":[{"key":"E","label":"..."}, ...]}
厳守事項:
- key は "E","V","Λ","Ǝ" のいずれか
- label は12〜18文字の自然な日本語。体言止めや短文OK。重複禁止
- 各keyのlabelは必ず次の意味領域に一致させる:
  - E = 衝動・情熱・行動（例: 勢い/一歩/踏み出す/動き出す）
  - V = 可能性・夢・理想（例: 未来/ビジョン/想像/描く）
  - Λ = 選択・葛藤・決断（例: 迷い/取捨/条件/絞る/決める）
  - Ǝ = 観測・静寂・受容（例: 落ち着く/観察/一拍/見つめる）
- keyとlabelの意味が一致しない出力をしないこと
- 日本語のみで出力。JSON以外の文字を前後に付けない`;

    const usr = `時間帯:${slot}（必要な選択肢:${n}）
テーマ: ソウルレイヤー診断のデイリー設問を1問だけ作る。
制約:
- questionは1文・20文字前後・落ち着いた短文
- 選択肢はE/V/Λ/Ǝから${n}個だけ採用（不足分は除外して良い）
- ユーザーの気分や行動方針を軽く自己観測できる内容にする
seed:${seed}`;

    const res = await oa.responses.create({
      model: "gpt-4o-mini", // まずは通りやすいモデルで確認。OKになったら必要に応じて変更
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

    // JSON抽出
    const m = raw.match(/\{[\s\S]*\}$/);
    const jsonText = m ? m[0] : raw;
    const parsed = JSON.parse(jsonText);

    if (parsed?.question && Array.isArray(parsed?.choices)) {
      question = String(parsed.question);
      // 整形 + 重複除去
      const picked: Choice[] = [];
      const seen = new Set<EV>();
      for (const c of parsed.choices as any[]) {
        if (!c || typeof c.key !== "string" || typeof c.label !== "string") continue;
        const key = c.key as EV;
        const label = c.label.trim();
        if (!["E", "V", "Λ", "Ǝ"].includes(key)) continue;
        if (seen.has(key)) continue;
        // ★ 最低限の意味一致チェック
        if (!matchesMeaning(key, label)) continue;
        // 長さをざっくり調整
        const norm = label.length > 20 ? label.slice(0, 18) + "…" : label;
        picked.push({ key, label: norm });
        seen.add(key);
        if (picked.length >= n) break;
      }
      choices = picked;
      if (choices.length) source = "ai";
    }
  } catch (e: any) {
    console.error("[/api/daily/question] OpenAI error:", e?.message ?? e);
  }

  // フォールバック（不足分を補完）
  if (!choices.length) {
    const used = new Set(choices.map((c) => c.key));
    for (const c of FALLBACK) {
      if (choices.length >= n) break;
      if (!used.has(c.key)) choices.push(c);
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
    source,
    question_id: `daily-${new Date().toISOString().slice(0, 10)}-${slot}`,
    ...(debug ? { debug: { envHasKey: !!process.env.OPENAI_API_KEY } } : {}),
  });
}
