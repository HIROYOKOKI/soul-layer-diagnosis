// app/api/profile/diagnose/route.ts
// app/api/profile/diagnose/route.ts
/* =============================================================
/* =============================================================
   Profile Diagnose API (fast-return + background save)
   Profile Diagnose API (fast-return + background save)
   - 先に結果を返す（体感UP）
   - 先に結果を返す（体感UP）
   - 保存は並行実行（失敗してもUIをブロックしない）
   - 保存は並行実行（失敗してもUIをブロックしない）
   - 生成量・モデルを絞って高速化
   - 生成量・モデルを絞って高速化
   ============================================================= */
   ============================================================= */


export const dynamic = "force-dynamic";          // プリレンダー禁止（常に動的）
export const dynamic = "force-dynamic";          // プリレンダー禁止（常に動的）
export const revalidate = 0;
export const revalidate = 0;
// Node.js ランタイム推奨（Edgeはレスポンス後のバックグラウンド処理が厳しいため）
// Node.js ランタイム推奨（Edgeはレスポンス後のバックグラウンド処理が厳しいため）
export const runtime = "nodejs";
export const runtime = "nodejs";
// 東京近傍優先（Vercel）
// 東京近傍優先（Vercel）
export const preferredRegion = ["hnd1", "sin1"];
export const preferredRegion = ["hnd1", "sin1"];


import { NextResponse } from "next/server";
import { NextResponse } from "next/server";
import { getOpenAI } from "../../../../lib/openai";
import { getOpenAI } from "../../../../lib/openai";
import { buildProfilePrompt, type ProfilePending } from "../../../../lib/prompts/profilePrompt";
import { buildProfilePrompt, type ProfilePending } from "../../../../lib/prompts/profilePrompt";


/* ========================
/* ========================
   Types
   Types
======================== */
======================== */
type Pending = ProfilePending;
type Pending = ProfilePending;


type DiagnoseDetail = {
type DiagnoseDetail = {
  fortune: string;
  fortune: string;
  personality: string;
  personality: string;
  work: string;
  work: string;
  partner: string;
  partner: string;
};
};


type AiJson = {
type AiJson = {
  detail: Partial<DiagnoseDetail>;
  detail: Partial<DiagnoseDetail>;
  luneaLines?: string[];
  luneaLines?: string[];
};
};


/* ========================
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
   Helpers
======================== */
======================== */
/** 許容バッファつきの長さ調整（±10〜20字許容） */
/** 許容バッファつきの長さ調整（±10〜20字許容） */
function softClampText(
function softClampText(
  src: string,
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
) {
  const text = (src || "").trim();
  const text = (src || "").trim();
  if (!text) return fallback;
  if (!text) return fallback;


  if (text.length > max + tol) return text.slice(0, max);
  if (text.length > max + tol) return text.slice(0, max);


  if (text.length < min - tol) {
<<<<<<< HEAD
    // AIが短すぎたときだけ、軽く整える（fallbackは混ぜない）
    const pad = " ……";
    return (text + pad).slice(0, Math.min(max, text.length + 5));
=======
  if (text.length < min - tol) {
    const need = min - text.length;
    const need = min - text.length;
    const add = (fallback || "").slice(0, need + 10);
    const add = (fallback || "").slice(0, need + 10);
    const merged = (text + " " + add).replace(/\s+/g, " ").trim();
    const merged = (text + " " + add).replace(/\s+/g, " ").trim();
    return merged.length > max ? merged.slice(0, max) : merged;
    return merged.length > max ? merged.slice(0, max) : merged;
>>>>>>> ce11cd3 (remove long fallback message from diagnose API)
  }
  }


  return text;
  return text;
}
}


<<<<<<< HEAD
=======
const FALLBACKS = {
  fortune: "観測中。今日の小さな一歩に意識を。",
  personality: "あなたの今の傾向を整理しています。",
  work: "短いスプリントで検証しよう。",
  partner: "互いのリズムを尊重し合おう。",
};


function getRanges(pending: Pending) {
>>>>>>> ce11cd3 (remove long fallback message from diagnose API)
function getRanges(pending: Pending) {
  const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace);
  const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace);
  return {
  return {
    fortune: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    fortune: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    personality: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    personality: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    work: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
    work: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
    partner: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
    partner: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
  };
  };
}
}


function sanitizeDetail(
function sanitizeDetail(
  d: Partial<DiagnoseDetail> | undefined,
  d: Partial<DiagnoseDetail> | undefined,
  ranges: ReturnType<typeof getRanges>
  ranges: ReturnType<typeof getRanges>
): DiagnoseDetail {
): DiagnoseDetail {
  const fortune = softClampText(d?.fortune || "", { ...ranges.fortune, fallback: FALLBACKS.fortune });
  const fortune = softClampText(d?.fortune || "", { ...ranges.fortune, fallback: FALLBACKS.fortune });
  const personality = softClampText(d?.personality || "", { ...ranges.personality, fallback: FALLBACKS.personality });
  const personality = softClampText(d?.personality || "", { ...ranges.personality, fallback: FALLBACKS.personality });
  const work = softClampText(d?.work || "", { ...ranges.work, fallback: FALLBACKS.work });
  const work = softClampText(d?.work || "", { ...ranges.work, fallback: FALLBACKS.work });
  const partner = softClampText(d?.partner || "", { ...ranges.partner, fallback: FALLBACKS.partner });
  const partner = softClampText(d?.partner || "", { ...ranges.partner, fallback: FALLBACKS.partner });
  return { fortune, personality, work, partner };
  return { fortune, personality, work, partner };
}
}


function pickSafeLines(lines: unknown): string[] {
function pickSafeLines(lines: unknown): string[] {
  const xs = Array.isArray(lines) ? (lines as unknown[]) : [];
  const xs = Array.isArray(lines) ? (lines as unknown[]) : [];
  return xs
  return xs
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
    .filter((s) => s.length > 0)
    .slice(0, 5);
    .slice(0, 5);
}
}


function safeJSON<T = any>(s?: string | null): T | null {
function safeJSON<T = any>(s?: string | null): T | null {
  try {
  try {
    return s ? (JSON.parse(s) as T) : null;
    return s ? (JSON.parse(s) as T) : null;
  } catch {
  } catch {
    return null;
    return null;
  }
  }
}
}


/* ========================
/* ========================
   Route
   Route
======================== */
======================== */
export async function POST(req: Request) {
export async function POST(req: Request) {
  try {
  try {
    const pending = (await req.json().catch(() => ({}))) as Pending;
    const pending = (await req.json().catch(() => ({}))) as Pending;


    const openai = getOpenAI();
    const openai = getOpenAI();
    if (!openai) throw new Error("openai_env_missing");
    if (!openai) throw new Error("openai_env_missing");


    // 速さ最優先の既定値（環境変数で上書き可）
    // 速さ最優先の既定値（環境変数で上書き可）
    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-5-mini";
    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-5-mini";


    // 出力量を明確に制限（速い）
    // 出力量を明確に制限（速い）
    const MAX_TOKENS = Number(process.env.OPENAI_PROFILE_MAXTOKENS || 550);
    const MAX_TOKENS = Number(process.env.OPENAI_PROFILE_MAXTOKENS || 550);


    const system =
    const system =
      'あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。出力は必ず厳密なJSONのみ。';
      'あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。出力は必ず厳密なJSONのみ。';
    // 外部プロンプトビルダーをそのまま利用（短文志向で）
    // 外部プロンプトビルダーをそのまま利用（短文志向で）
    const user = buildProfilePrompt(pending);
    const user = buildProfilePrompt(pending);


    // 一部モデルは max_tokens ではなく max_completion_tokens、
    // 一部モデルは max_tokens ではなく max_completion_tokens、
<<<<<<< HEAD
    // かつ temperature=1 固定（任意値不可）のため、温度は指定しない
=======
   // かつ temperature=1 固定（任意値不可）のため、温度は指定しない
   // かつ temperature=1 固定（任意値不可）のため、温度は指定しない
    const resp = await openai.chat.completions.create({
>>>>>>> 88d5096 (remove long fallback message from diagnose API)
    const resp = await openai.chat.completions.create({
      model,
      model,
      response_format: { type: "json_object" },
      response_format: { type: "json_object" },
      messages: [
      messages: [
        { role: "system", content: system },
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
        { role: "user", content: JSON.stringify(user) },
      ],
      ],
      max_completion_tokens: MAX_TOKENS,
      max_completion_tokens: MAX_TOKENS,
      // temperature は未指定（モデル既定=1）
      // temperature は未指定（モデル既定=1）
    });
    });


    const raw = resp.choices?.[0]?.message?.content || "{}";
    const raw = resp.choices?.[0]?.message?.content || "{}";
    const parsed = safeJSON<AiJson>(raw) || { detail: {}, luneaLines: [] };
    const parsed = safeJSON<AiJson>(raw) || { detail: {}, luneaLines: [] };


    // 整形（切り詰め/補完）
    // 整形（切り詰め/補完）
    const ranges = getRanges(pending);
    const ranges = getRanges(pending);
    const detail = sanitizeDetail(parsed.detail, ranges);
    const detail = sanitizeDetail(parsed.detail, ranges);


    const luneaLines = (() => {
    const luneaLines = (() => {
      const xs = pickSafeLines(parsed.luneaLines);
      const xs = pickSafeLines(parsed.luneaLines);
      if (xs.length >= 3) return xs;
      if (xs.length >= 3) return xs;
      const add: string[] = [];
      const add: string[] = [];
      if (detail.fortune) add.push(detail.fortune.slice(0, 60));
      if (detail.fortune) add.push(detail.fortune.slice(0, 60));
      if (detail.personality) add.push(detail.personality.slice(0, 60));
      if (detail.personality) add.push(detail.personality.slice(0, 60));
      if (add.length === 0) {
      if (add.length === 0) {
        add.push("…観測中。きみの“いま”を読み解いているよ。");
        add.push("…観測中。きみの“いま”を読み解いているよ。");
        add.push("今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。");
        add.push("今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。");
      }
      }
      return pickSafeLines([...xs, ...add]);
      return pickSafeLines([...xs, ...add]);
    })();
    })();


    // ===== 先に返す（体感改善）=====
    // ===== 先に返す（体感改善）=====
    const resBody = {
    const resBody = {
      ok: true as const,
      ok: true as const,
      result: {
      result: {
        name: pending?.name || "",
        name: pending?.name || "",
        luneaLines,
        luneaLines,
        detail,
        detail,
        theme: (pending as any)?.theme || null,
        theme: (pending as any)?.theme || null,
      },
      },
    };
    };


    // Cacheを明示的に無効化（中継CDNでの再利用を避ける）
    // Cacheを明示的に無効化（中継CDNでの再利用を避ける）
    const res = NextResponse.json(resBody, {
    const res = NextResponse.json(resBody, {
      headers: {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Cache-Control": "no-store, max-age=0",
      },
      },
    });
    });


    // ===== 保存は並行で実行（失敗してもUIをブロックしない）=====
    // ===== 保存は並行で実行（失敗してもUIをブロックしない）=====
    (async () => {
    (async () => {
      try {
      try {
        const { getSupabaseAdmin } = await import("../../../../lib/supabase-admin");
        const { getSupabaseAdmin } = await import("../../../../lib/supabase-admin");
        const sb = getSupabaseAdmin();
        const sb = getSupabaseAdmin();
        if (!sb) return;
        if (!sb) return;


        await sb.from("profile_results").insert({
        await sb.from("profile_results").insert({
          theme: (pending as any)?.theme ?? "dev",
          theme: (pending as any)?.theme ?? "dev",
          name: pending?.name ?? null,
          name: pending?.name ?? null,
          birthday: (pending as any)?.birthday ?? null,
          birthday: (pending as any)?.birthday ?? null,
          blood: (pending as any)?.blood ?? null,
          blood: (pending as any)?.blood ?? null,
          gender: (pending as any)?.gender ?? null,
          gender: (pending as any)?.gender ?? null,
          preference: (pending as any)?.preference ?? null,
          preference: (pending as any)?.preference ?? null,
          fortune: detail.fortune,
          fortune: detail.fortune,
          personality: detail.personality,
          personality: detail.personality,
          work: detail.work,
          work: detail.work,
          partner: detail.partner,
          partner: detail.partner,
        });
        });
      } catch (_e) {
      } catch (_e) {
        // ログだけ（本体の応答は既に返している）
        // ログだけ（本体の応答は既に返している）
        console.warn("[profile/diagnose] save failed");
        console.warn("[profile/diagnose] save failed");
      }
      }
    })();
    })();


    return res;
    return res;
  } catch (e: any) {
  } catch (e: any) {
    return NextResponse.json(
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
      { status: 500 }
    );
    );
  }
  }
}
}
