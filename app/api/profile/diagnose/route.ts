// app/api/profile/diagnose/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const preferredRegion = ["hnd1", "sin1"];

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getOpenAI } from "@/lib/openai";
import { buildProfilePrompt, type ProfilePending } from "@/lib/prompts/profilePrompt";

/* ========== Types ========== */
type Pending = ProfilePending;
type DiagnoseDetail = { fortune: string; personality: string; work: string; partner: string };
type AiJson = { detail?: Partial<DiagnoseDetail>; luneaLines?: string[] };

/* ========== Fallbacks ========== */
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

/* ========== Helpers ========== */
function softClampText(
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
  const text = (src || "").trim();
  if (!text) return fallback;
  if (text.length > max + tol) return text.slice(0, max);
  if (text.length < min - tol) return (text + " ……").slice(0, Math.min(max, text.length + 5));
  return text;
}

function getRanges(p: Pending) {
  const hasAstro = Boolean(p?.birthTime && p?.birthPlace);
  return {
    fortune: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    personality: { min: hasAstro ? 200 : 150, max: hasAstro ? 230 : 190 },
    work: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
    partner: { min: hasAstro ? 90 : 70, max: hasAstro ? 110 : 90 },
  };
}

function sanitizeDetail(d: Partial<DiagnoseDetail> | undefined, r: ReturnType<typeof getRanges>): DiagnoseDetail {
  return {
    fortune:     softClampText(d?.fortune ?? "",     { ...r.fortune,     fallback: FALLBACKS.fortune }),
    personality: softClampText(d?.personality ?? "", { ...r.personality, fallback: FALLBACKS.personality }),
    work:        softClampText(d?.work ?? "",        { ...r.work,        fallback: FALLBACKS.work }),
    partner:     softClampText(d?.partner ?? "",     { ...r.partner,     fallback: FALLBACKS.partner }),
  };
}

function pickSafeLines(lines: unknown): string[] {
  const xs = Array.isArray(lines) ? (lines as unknown[]) : [];
  return xs.map(s => (typeof s === "string" ? s.trim() : ""))
           .filter(Boolean)
           .slice(0, 5);
}

function safeJSON<T = any>(s?: string | null): T | null {
  try { return s ? (JSON.parse(s) as T) : null } catch { return null }
}

/* ========== Route ========== */
export async function POST(req: Request) {
  try {
    const pending = (await req.json().catch(() => ({}))) as Pending;

    const openai = getOpenAI();
    if (!openai) throw new Error("openai_env_missing");

    const MODEL = process.env.OPENAI_PROFILE_MODEL || "gpt-4o-mini";
    const MAX_TOKENS = Number(process.env.OPENAI_PROFILE_MAXTOKENS || 550);

    // 4キー（fortune/personality/work/partner）を明示
    const system = [
      "あなたはAIアシスタント『ルネア（Lunea）』です。",
      "入力プロフィールをもとに、今年（2026年）基準でやさしく短く語ります。",
      "出力はJSON。キーは fortune, personality, work, partner。各セクションは指定文字数内。",
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

    const body = {
      ok: true as const,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail,
        theme: (pending as any)?.theme || "dev",
      },
    };

    // すぐ返す
    const res = NextResponse.json(body, { headers: { "cache-control": "no-store" } });

    // ---- 非同期保存（ユーザーに紐付け） ----
    (async () => {
      try {
        const sb = createRouteHandlerClient({ cookies });
        const { data: au } = await sb.auth.getUser();
        const uid = au?.user?.id ?? null;

        const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
        const admin = getSupabaseAdmin();
        if (!admin) return;

        await admin.from("profile_results").insert({
          user_id: uid,                                // ← 紐付け
          theme: (pending as any)?.theme ?? "dev",
          name: pending?.name ?? null,
          birthday: pending?.birthday ?? null,
          birth_time: (pending as any)?.birthTime ?? null,
          birth_place: (pending as any)?.birthPlace ?? null,
          sex: (pending as any)?.sex ?? null,
          preference: (pending as any)?.preference ?? null,
          fortune: detail.fortune,
          personality: detail.personality,
          work: detail.work,
          partner: detail.partner,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("[profile/diagnose] async save failed:", e);
      }
    })();

    return res;
  } catch (e: any) {
    console.error("[profile/diagnose] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
