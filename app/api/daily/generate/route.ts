// app/api/daily/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getOpenAI } from "../../../../lib/openai"; // 既存の遅延生成ラッパーを利用

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";

const SLOT_COUNTS: Record<Slot, number> = { morning: 4, noon: 3, night: 2 };

const PAD = (n: number) => String(n).padStart(2, "0");
function todayId(slot: Slot) {
  const d = new Date();
  return `daily-${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}-${slot}`;
}

function defaultOptions(n: number): { key: EV; label: string }[] {
  const base: { key: EV; label: string }[] = [
    { key: "E", label: "意志（E）" },
    { key: "V", label: "感受（V）" },
    { key: "Λ", label: "構築（Λ）" },
    { key: "Ǝ", label: "反転（Ǝ）" },
  ];
  return base.slice(0, Math.max(2, Math.min(4, n)));
}

function sanitizeOptions(arr: any, n: number): { key: EV; label?: string }[] {
  const ok = new Set<EV>(["E", "V", "Λ", "Ǝ"]);
  const list: { key: EV; label?: string }[] = Array.isArray(arr)
    ? arr
        .map((o) => (typeof o?.key === "string" ? { key: o.key as EV, label: o?.label } : null))
        .filter((o) => o && ok.has(o.key)) as any
    : [];
  // 重複除去＋不足分補完
  const seen = new Set<string>();
  const uniq = list.filter((o) => !seen.has(o.key) && seen.add(o.key));
  for (const o of defaultOptions(n)) {
    if (uniq.length >= n) break;
    if (!seen.has(o.key)) { uniq.push(o); seen.add(o.key); }
  }
  return uniq.slice(0, n);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const slot = (body?.slot ?? "morning") as Slot;  // morning=4, noon=3, night=2
  const theme = (body?.theme ?? "self") as string;
  const env = (body?.env ?? "prod") as Env;
  const n = SLOT_COUNTS[slot] ?? 4;
  const id = todayId(slot);

  // フォールバック（AI失敗や未設定でも返す）
  let text = "いまのあなたの重心はどれに近い？";
  let options = defaultOptions(n);

  try {
    const openai = getOpenAI(); // OPENAI_API_KEY が未設定なら内部で例外化される想定

    const sys = "あなたは日本語で短い設問を作るアシスタントです。出力は必ずJSONのみ。";
    const user = [
      `目的: EVΛƎ（E/V/Λ/Ǝ）のうち ${n} 個を選択肢として出す短い設問を作成。`,
      `制約: 文章は80字以内。日常の言い回しで。`,
      `選択肢: { key: "E"|"V"|"Λ"|"Ǝ", label?: string } の配列。`,
      `slot=${slot} / theme=${theme}`,
      `例ラベル: E=意志, V=感受, Λ=構築, Ǝ=反転（省略可）`,
      `出力は JSON（text, options のみ）`,
    ].join("\n");

    // responses API が使えればそちらを、だめなら chat.completions
    let content = "";
    try {
      // @ts-ignore
      const r1 = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "DailyQ",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["text", "options"],
              properties: {
                text: { type: "string", minLength: 6, maxLength: 80 },
                options: {
                  type: "array",
                  minItems: n,
                  maxItems: n,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["key"],
                    properties: {
                      key: { type: "string", enum: ["E", "V", "Λ", "Ǝ"] },
                      label: { type: "string" },
                    },
                  },
                },
              },
            },
            strict: true,
          },
        },
      });
      // @ts-ignore
      content = (r1?.output_text ?? "").trim();
    } catch {
      // @ts-ignore
      const r2 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.7,
      });
      // @ts-ignore
      content = (r2?.choices?.[0]?.message?.content ?? "").trim();
    }

    const jsonText =
      content.match(/```json([\s\S]*?)```/i)?.[1]?.trim() ||
      content.match(/```([\s\S]*?)```/i)?.[1]?.trim() ||
      content;
    const parsed = JSON.parse(jsonText);
    text = typeof parsed?.text === "string" ? parsed.text : text;
    options = sanitizeOptions(parsed?.options, n);
  } catch {
    // フォールバックで返す（ログは省略）
  }

  return NextResponse.json(
    { ok: true, id, slot, env, text, options, ts: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } }
  );
}
