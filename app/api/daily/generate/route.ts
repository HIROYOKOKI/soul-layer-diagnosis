// app/api/daily/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
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
        .map((o) =>
          o && typeof o.key === "string"
            ? ({ key: o.key as EV, label: typeof o.label === "string" ? o.label : undefined } as const)
            : null
        )
        .filter((o) => o && ok.has(o.key as EV)) as any
    : [];
  const seen = new Set<string>();
  const uniq = list.filter((o) => !seen.has(o.key) && seen.add(o.key));
  for (const o of defaultOptions(n)) {
    if (uniq.length >= n) break;
    if (!seen.has(o.key)) {
      uniq.push(o);
      seen.add(o.key);
    }
  }
  return uniq.slice(0, n);
}

/** MyPageと同じテーマを取得。body.theme が妥当ならそれを優先。 */
async function resolveTheme(req: Request, bodyTheme?: string | null): Promise<Theme> {
  const normalized = (bodyTheme ?? "").toString().trim().toUpperCase();
  if (THEMES.includes(normalized as Theme)) return normalized as Theme;

  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const r = await fetch(`${origin}/api/theme`, {
      cache: "no-store",
      headers: { cookie: (req.headers.get("cookie") ?? "") as string },
    });
    if (r.ok) {
      const j = await r.json().catch(() => ({} as any));
      const t = (j?.scope ?? j?.theme ?? "").toString().trim().toUpperCase();
      if (THEMES.includes(t as Theme)) return t as Theme;
    }
  } catch {
    /* noop */
  }
  return "LOVE";
}

/** OpenAIへ問い合わせ（JSON限定）してパース。失敗時はthrow。 */
async function generateQuestionJSON(n: number, theme: Theme, slot: Slot) {
  const openai = getOpenAI();
  if (!openai) throw new Error("openai_env_missing");

  const sys = [
    "あなたのソウルレイヤーを静かに照らす案内人",
    "出力は必ず JSON 1オブジェクトのみ。コードブロックや説明は出さない。",
    'スキーマ: {"text": string, "options": [{"key":"E|V|Λ|Ǝ","label": string}...]}',
  ].join("\n");

  const user = [
    `目的: EVΛƎ（E/V/Λ/Ǝ）のうち ${n} 個を選択肢として出す短い設問を作成。`,
    `制約: 文章は80字以内。日常の言い回しで。テーマは ${theme}。`,
    `選択肢: key は E|V|Λ|Ǝ のいずれか。label は省略せず自然文で。`,
    `slot=${slot}`,
    `出力: 上記スキーマの JSON オブジェクトのみ（前後の文章・マークダウン禁止）`,
  ].join("\n");

  const r = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }, // ★ JSONを強制
  });

  const content = (r?.choices?.[0]?.message?.content ?? "").trim();
  if (!content) throw new Error("empty_openai_response");

  // 一発パース → こけたら救済パース
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    const jsonText =
      content.match(/```json([\s\S]*?)```/i)?.[1]?.trim() ||
      content.match(/```([\s\S]*?)```/i)?.[1]?.trim() ||
      content;
    parsed = JSON.parse(jsonText);
  }

  const textRaw =
    typeof parsed?.text === "string"
      ? parsed.text
      : typeof parsed?.question === "string"
      ? parsed.question
      : null;

  if (!textRaw) throw new Error("missing_text_in_response");

  return {
  text: textRaw as string,
  options: sanitizeOptions(parsed?.options, n),
  _raw: debug ? content : undefined,  // ★ デバッグ時のみ生レス返す
};
}

export async function POST(req: Request) {
  const debug = Boolean(body?.debug) || /[?&]debug=1/.test(req.url);
  const body = await req.json().catch(() => ({} as any));
  const slot = (body?.slot ?? "morning") as Slot; // morning=4, noon=3, night=2
  const env = (body?.env ?? "prod") as Env;
  const n = SLOT_COUNTS[slot] ?? 4;
  const id = todayId(slot);

  const theme = await resolveTheme(req, body?.theme);

  // デフォルト（フォールバック）
  let text = "いまのあなたの重心はどれに近い？";
  let options = defaultOptions(n);

  // 1回目試行 → 失敗時は1回だけ再試行
  try {
    const g1 = await generateQuestionJSON(n, theme, slot);
    text = g1.text;
    options = g1.options;
  } catch (e1: any) {
    console.error("daily.generate.error#1", { err: e1?.message ?? String(e1), slot, theme, n });
    try {
      const g2 = await generateQuestionJSON(n, theme, slot);
      text = g2.text;
      options = g2.options;
    } catch (e2: any) {
      console.error("daily.generate.error#2", { err: e2?.message ?? String(e2), slot, theme, n });
      // フォールバック継続（text / options は初期値のまま）
    }
  }

  return NextResponse.json(
    {
      ok: true,
      id,
      slot,
      env,
      theme, // MyPage表示用
      text,
      options,
      ts: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
