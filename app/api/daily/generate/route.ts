// app/api/daily/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOpenAI } from "@/lib/openai"; // 既存の遅延生成ラッパー

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
        .map((o) => (typeof o?.key === "string" ? { key: o.key as EV, label: o?.label } : null))
        .filter((o) => o && ok.has(o.key)) as any
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
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    // 認証Cookieを引き継いで /api/theme を叩く（ユーザーの最新テーマ）
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
    /* noop: フォールバックに任せる */
  }
  // フォールバック（ズレ防止のため LOVE を既定に）
  return "LOVE";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const slot = (body?.slot ?? "morning") as Slot; // morning=4, noon=3, night=2
  const env = (body?.env ?? "prod") as Env;
  const n = SLOT_COUNTS[slot] ?? 4;
  const id = todayId(slot);

  // --- テーマ決定（MyPageと同期）
  const theme = await resolveTheme(req, body?.theme);

  // フォールバック（AI失敗や未設定でも返す）
  let text = "いまのあなたの重心はどれに近い？";
  let options = defaultOptions(n);

  try {
    const openai = getOpenAI(); // 未設定時は内部で例外化

    const sys = "あなたは日本語で短い設問を作るアシスタントです。出力は必ずJSONのみ。";
    const user = [
      `目的: EVΛƎ（E/V/Λ/Ǝ）のうち ${n} 個を選択肢として出す短い設問を作成。`,
      `制約: 文章は80字以内。日常の言い回しで。テーマは ${theme}。`,
      `選択肢: { key: "E"|"V"|"Λ"|"Ǝ", label?: string } の配列。`,
      `slot=${slot}`,
      `例ラベル: E=意志, V=感受, Λ=構築, Ǝ=反転（省略可）`,
      `出力は JSON（text, options のみ）`,
    ].join("\n");

    // chat.completions（プロジェクト方針：gpt-5-mini に統一）
    // responses API は環境により未提供のことがあるため単一路線で安定運用
    // @ts-ignore
    const r = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });
    // @ts-ignore
    const content = (r?.choices?.[0]?.message?.content ?? "").trim();

    const jsonText =
      content.match(/```json([\s\S]*?)```/i)?.[1]?.trim() ||
      content.match(/```([\s\S]*?)```/i)?.[1]?.trim() ||
      content;

    const parsed = JSON.parse(jsonText);
    text = typeof parsed?.text === "string" ? parsed.text : text;
    options = sanitizeOptions(parsed?.options, n);
  } catch {
    // フォールバックで返す（ログはAPIゲートウェイ側に残る想定）
  }

  return NextResponse.json(
    {
      ok: true,
      id,
      slot,
      env,
      theme, // ← フロント表示用に返す（MyPageと一致）
      text,
      options,
      ts: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
