// app/api/profile/diagnose/route.ts
/* =============================================================
   Profile Diagnose API (fast-return + background save)
   - 先に結果を返す（体感UP）
   - 保存は並行実行（失敗してもUIをブロックしない）
   - 生成量・モデルを絞って高速化
   ============================================================= */

export const dynamic = "force-dynamic";          // プリレンダー禁止（常に動的）
export const revalidate = 0;
// Node.js ランタイム推奨（Edgeはレスポンス後のバックグラウンド処理が厳しいため）
export const runtime = "nodejs";
// 東京近傍優先（Vercel）
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
   Fallbacks（← 追加）
   OpenAIが失敗/短文でもユーザー体験を壊さないための最小文面
======================== */
const FALLBACKS: DiagnoseDetail = {
  fortune: "今日は小さく始めるほど流れが整う日。10分だけの行動で良いので一歩進めよう。",
  personality: "観測と直感のバランスが良い時期。小さな違和感を丁寧に拾えるタイプです。",
  work: "短いサイクルで試作→観測→調整が◎。完璧より速度、数で当てにいこう。",
  partner: "相手の“いまの気分”を言葉にして返すと関係が整いやすいでしょう。",
};

/* ========================
   Helpers
======================== */
/** 許容バッファつきの長さ調整（±10〜20字許容） */
function softClampText(
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
  const text = (src || "").trim();
  if (!text) return fallback;

  if (text.length > max + tol) return text.slice(0, max);

  if (text.length < min - tol) {
    // AIが短すぎたときだけ、軽く整える（fallbackは混ぜない）
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
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
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

    // 速さ最優先の既定値（環境変数で上書き可）
    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-5-mini";

    // 出力量を明確に制限（速い）
    const MAX_TOKENS = Number(process.env.OPENAI_PROFILE_MAXTOKENS || 550);

    const system =
      'あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。出力は必ず厳密なJSONのみ。';
    // 外部プロンプトビルダーをそのまま利用（短文志向で）
    const user = buildProfilePrompt(pending);

    // 一部モデルは max_tokens ではなく max_completion_tokens、
    // かつ temperature=1 固定（任意値不可）のため、温度は指定しない
    const resp = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      max_completion_tokens: MAX_TOKENS,
      // temperature は未指定（モデル既定=1）
    });

    const raw = resp.choices?.[0]?.message?.content || "{}";
    const parsed = safeJSON<AiJson>(raw) || { detail: {}, luneaLines: [] };

    // 整形（切り詰め/補完）
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
        add.push("今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。");
      }
      return pickSafeLines([...xs, ...add]);
    })();

    // ===== 先に返す（体感改善）=====
    const resBody = {
      ok: true as const,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail,
        theme: (pending as any)?.theme || null,
      },
    };

    // Cacheを明示的に無効化（中継CDNでの再利用を避ける）
    const res = NextResponse.json(resBody, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });

    // ===== 保存は並行で実行（失敗してもUIをブロックしない）=====
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
      } catch (_e) {
        // ログだけ（本体の応答は既に返している）
        console.warn("[profile/diagnose] save failed");
      }
    })();

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
