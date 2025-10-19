// app/api/profile/diagnose/route.ts
/* =============================================================
   Profile Diagnose API (fast-return + background save)
   - 先に結果を返す（体感UP）
   - 保存は並行実行（失敗してもUIをブロックしない）
   - 生成量・モデルを絞って高速化
   ============================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const preferredRegion = ["hnd1", "sin1"];

import { NextResponse } from "next/server";
import { getOpenAI } from "../../../../lib/openai";
import { buildProfilePrompt, type ProfilePending } from "../../../../lib/prompts/profilePrompt";

/* ========================
   Types
======================== */
type Pending = ProfilePending;

type DiagnoseDetail = {
  fortune: string;
  personality: string;
  work: string;
  partner: string;
};

type AiJson = {
  detail: Partial<DiagnoseDetail>;
  luneaLines?: string[];
};

/* ========================
   Fallbacks（総合運に修正済み）
======================== */
const FALLBACKS: DiagnoseDetail = {
  fortune:
    "小さく始めた行動ほど流れが整い、習慣へと育つ傾向。10分の集中を積み重ねるほど、運の巡りが安定していきます。",
  personality:
    "観測と直感のバランスが良い時期。小さな違和感を丁寧に拾えるタイプです。",
  work:
    "短いサイクルで試作→観測→調整が◎。完璧より速度、数で当てにいこう。",
  partner:
    "相手の“いまの気分”を言葉にして返すと関係が整いやすいでしょう。",
};

/* ========================
   Helpers
======================== */
function softClampText(
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
  const text = (src || "").trim();
  if (!text) return fallback;
  if (text.length > max + tol) return text.slice(0, max);
  if (text.length < min - tol) {
    const pad = " ……";
    return (text + pad).slice(0, Math.min(max, text.length + 5));
  }
  return text;
}

function getRanges(pending: Pending) {
  const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace);
  return {
    fortune: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    personality: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    work: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
    partner: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
  };
}

function sanitizeDetail(
  d: Partial<DiagnoseDetail> | undefined,
  ranges: ReturnType<typeof getRanges>
): DiagnoseDetail {
  const fortune = softClampText(d?.fortune || "", { ...ranges.fortune, fallback: FALLBACKS.fortune });
  const personality = softClampText(d?.personality || "", { ...ranges.personality, fallback: FALLBACKS.personality });
  const work = softClampText(d?.work || "", { ...ranges.work, fallback: FALLBACKS.work });
  const partner = softClampText(d?.partner || "", { ...ranges.partner, fallback: FALLBACKS.partner });
  return { fortune, personality, work, partner };
}

function pickSafeLines(lines: unknown): string[] {
  const xs = Array.isArray(lines) ? (lines as unknown[]) : [];
  return xs
    .map(s => (typeof s === "string" ? s.trim() : ""))
    .filter(s => s.length > 0)
    .slice(0, 5);
}

function safeJSON<T = any>(s?: string | null): T | null {
  try {
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

/* ========================
   Route
======================== */
export async function POST(req: Request) {
  try {
    const pending = (await req.json().catch(() => ({}))) as Pending;

    const openai = getOpenAI();
    if (!openai) throw new Error("openai_env_missing");

    // 💡 モデル指定を環境変数 + fallback に変更
    const MODEL = process.env.OPENAI_PROFILE_MODEL || "gpt-4o-mini";
    const MAX_TOKENS = Number(process.env.OPENAI_PROFILE_MAXTOKENS || 550);

    // 💬 Luneaの人格と出力形式を明確化
    const system = [
      "あなたはAIアシスタント『ルネア（Lunea）』です。",
      "入力されたプロフィールをもとに、性格傾向・運命・理想像をやさしく語ります。",
      "出力はJSON形式で、キーは fortune, personality, partner。",
      "語り口は親しみやすく、少し詩的に。",
    ].join("\n");

    const user = buildProfilePrompt(pending);

    const resp = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      max_tokens: MAX_TOKENS,
    });

    const raw = resp.choices?.[0]?.message?.content || "{}";
    const parsed = safeJSON<AiJson>(raw) || { detail: {}, luneaLines: [] };

    const ranges = getRanges(pending);
    const detail = sanitizeDetail(parsed.detail, ranges);

    const luneaLines = (() => {
      const xs = pickSafeLines(parsed.luneaLines);
      if (xs.length >= 3) return xs;
      const add: string[] = [];
      if (detail.fortune) add.push(detail.fortune.slice(0, 60));
      if (detail.personality) add.push(detail.personality.slice(0, 60));
      if (add.length === 0) {
        add.push("…観測中。きみの“いま”を読み解いているよ。");
        add.push("小さく始めた一歩が、意味の流れを整えていく。");
      }
      return pickSafeLines([...xs, ...add]);
    })();

    const resBody = {
      ok: true as const,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail,
        theme: (pending as any)?.theme || null,
      },
    };

    const res = NextResponse.json(resBody, {
      headers: { "cache-control": "no-store, max-age=0" },
    });

    // 🔄 非同期保存（UIブロックなし）
    (async () => {
      try {
        const { getSupabaseAdmin } = await import("../../../../lib/supabase-admin");
        const sb = getSupabaseAdmin();
        if (!sb) return;
        await sb.from("profile_results").insert({
          theme: (pending as any)?.theme ?? "dev",
          name: pending?.name ?? null,
          birthday: (pending as any)?.birthday ?? null,
          blood: (pending as any)?.blood ?? null,
          gender: (pending as any)?.gender ?? null,
          preference: (pending as any)?.preference ?? null,
          fortune: detail.fortune,
          personality: detail.personality,
          work: detail.work,
          partner: detail.partner,
        });
      } catch {
        console.warn("[profile/diagnose] save failed");
      }
    })();

    return res;
  } catch (e: any) {
    console.error("[profile/diagnose] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
