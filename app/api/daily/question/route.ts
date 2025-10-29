// =============================================================
// app/api/daily/question/route.ts（改訂版）
// 変更点：ユーザー名を取得して LUNEA_SYSTEM_PROMPT_FOR(name) を使用
// =============================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import OpenAI from "openai";
import { LUNEA_SYSTEM_PROMPT_FOR } from "@/app/_data/characters/lunea";

/* ===== 型定義 ===== */
type Slot = "morning" | "noon" | "night";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type EV = "E" | "V" | "Λ" | "Ǝ";

/* ===== ユーザー名取得 ===== */
async function getUserName() {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: prof } = await sb
    .from("profiles")
    .select("name, display_id, user_no")
    .eq("id", user.id)
    .maybeSingle();

  const byProfile = prof?.name || prof?.display_id || prof?.user_no;
  const byMeta = (user.user_metadata as any)?.name as string | undefined;
  const byEmail = user.email?.split("@")[0];

  return (byProfile || byMeta || byEmail || null) as string | null;
}

/* ===== フォールバック選択肢 ===== */
const FALLBACK: Record<Slot, { key: EV; label: string }[]> = {
  morning: [
    { key: "E", label: "直感で素早く動く" },
    { key: "V", label: "理想のイメージから始める" },
    { key: "Λ", label: "条件を決めて選ぶ" },
    { key: "Ǝ", label: "一拍置いて様子を見る" },
  ],
  noon: [
    { key: "E", label: "勢いで一歩進める" },
    { key: "V", label: "可能性を広げる選択をする" },
    { key: "Λ", label: "目的に沿って最短を選ぶ" },
  ],
  night: [
    { key: "Ǝ", label: "今日は観測と整理に徹する" },
    { key: "V", label: "明日に向けて静かに構想する" },
  ],
};

const NEED = (slot: Slot) => (slot === "morning" ? 4 : slot === "noon" ? 3 : 2);
const ORIGIN = (reqUrl: string) =>
  process.env.NEXT_PUBLIC_SITE_URL ?? new URL(reqUrl).origin;

/* ===== JSTスロット ===== */
function getJstSlot(now = new Date()): Slot {
  const hourFmt = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  });
  const h = Number(hourFmt.format(now));
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}
function toJstDateString(d: string | Date) {
  const dt = new Date(d);
  return new Date(dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })).toDateString();
}
function seedFromUUID(uuid: string): number {
  const head = uuid.replace(/-/g, "").slice(0, 8);
  return Number.parseInt(head, 16) >>> 0;
}

/* ===== ベクトル演算ユーティリティ ===== */
type Vec = { E: number; V: number; L: number; Ze: number };
function clamp100(n: number) { return Math.max(0, Math.min(100, n)); }
function nz(v?: number | null) { return typeof v === "number" && !Number.isNaN(v); }
function normScore(x?: number | null): number | null {
  if (!nz(x)) return null;
  const n = x as number;
  return n <= 1 ? clamp100(n * 100) : clamp100(n);
}
function fromScoreMap(m?: any): Vec | null {
  if (!m) return null;
  const E = normScore(m.E);
  const V = normScore(m.V);
  const L = normScore(m["Λ"] ?? m.L);
  const Ze = normScore(m["Ǝ"] ?? m.Ze);
  if ([E, V, L, Ze].every(nz)) {
    return { E: E!, V: V!, L: L!, Ze: Ze! };
  }
  return null;
}
function themeVector(theme: Theme): Vec {
  switch (theme) {
    case "WORK":   return { E: 30, V: 20, L: 35, Ze: 15 };
    case "LOVE":   return { E: 20, V: 40, L: 20, Ze: 20 };
    case "FUTURE": return { E: 28, V: 38, L: 18, Ze: 16 };
    case "LIFE":   return { E: 23, V: 27, L: 23, Ze: 27 };
  }
}
const ZERO: Vec = { E: 0, V: 0, L: 0, Ze: 0 };
function add(a: Vec, b: Vec): Vec { return { E: a.E + b.E, V: a.V + b.V, L: a.L + b.L, Ze: a.Ze + b.Ze }; }
function mul(a: Vec, k: number): Vec { return { E: a.E * k, V: a.V * k, L: a.L * k, Ze: a.Ze * k }; }
function normFinal(v: Vec): Vec { return { E: clamp100(v.E), V: clamp100(v.V), L: clamp100(v.L), Ze: clamp100(v.Ze) }; }

/* =============================================================
   GET: 質問生成（LUNEA_SYSTEM_PROMPT_FOR(name)を使用）
   ============================================================= */
export async function GET(req: Request) {
  const origin = ORIGIN(req.url);
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const jar = cookies();
  const cookieHeader = (req.headers.get("cookie") ?? "") as string;

  // 1) ユーザー名取得
  const userName = await getUserName();

  // 2) テーマ取得
  let theme: Theme = "LOVE";
  try {
    const r = await fetch(`${origin}/api/theme`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    const j = await r.json().catch(() => ({}));
    const t = String(j?.scope ?? j?.theme ?? "LOVE").toUpperCase();
    if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(t)) theme = t as Theme;
  } catch {}

  // 3) JSTスロット
  const slot = getJstSlot();
  const need = NEED(slot);

  // 4) /api/daily/generate 呼び出し（LUNEA_SYSTEM_PROMPT_FOR(name)を注入）
  let text = "";
  let options: { key?: string; label?: string }[] = [];

  try {
    const client = new OpenAI();
    const messages = [
      { role: "system", content: LUNEA_SYSTEM_PROMPT_FOR(userName ?? undefined) },
      {
        role: "user",
        content: JSON.stringify({
          slot,
          theme,
          instruction:
            "ルネアとして1問4択の質問を生成してください。質問は50〜100文字以内、選択肢は20〜50文字以内で、すべて日本語で自然に。",
        }),
      },
    ];

    const res = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(raw);
    text = json.question ?? "";
    options = Array.isArray(json.options) ? json.options : [];
  } catch {
    // fallback: /api/daily/generate に委譲
    try {
      const r = await fetch(`${origin}/api/daily/generate`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          cookie: cookieHeader,
        },
        body: JSON.stringify({ slot, theme }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.ok) {
        text = String(j.text ?? "");
        options = Array.isArray(j.options) ? j.options : [];
      }
    } catch {}
  }

  // 5) 選択肢フォールバック
  const keys: EV[] = ["E", "V", "Λ", "Ǝ"];
  let choices = (options || [])
    .slice(0, need)
    .map((o, i) => {
      const k = keys.includes(o?.key as EV) ? (o!.key as EV) : (keys[i] as EV);
      const label = (o?.label ?? "").toString().trim();
      return { key: k, label };
    })
    .filter((c) => c.label);
  const have = new Set(choices.map((c) => c.key));
  for (const c of FALLBACK[slot]) {
    if (choices.length >= need) break;
    if (!have.has(c.key)) {
      choices.push(c);
      have.add(c.key);
    }
  }
  if (choices.length === 0) choices = FALLBACK[slot].slice(0, need);
  if (choices.length > need) choices = choices.slice(0, need);

  // 6) メタ情報
  const questionId = crypto.randomUUID();
  const seed = seedFromUUID(questionId);
  const createdAt = new Date().toISOString();
  const question =
    text?.trim() ||
    (slot === "morning"
      ? "今のあなたに必要な最初の一歩はどれ？"
      : slot === "noon"
      ? "このあと数時間で進めたい進路は？"
      : "今日はどんな締めくくりが心地いい？");

  // Cookie保存
  jar.set("daily_question_id", questionId, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set("daily_slot", slot, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set("daily_theme", theme, { httpOnly: true, sameSite: "lax", path: "/" });

  // 7) レスポンス
  return NextResponse.json(
    {
      ok: true,
      question_id: questionId,
      seed,
      slot,
      theme,
      question: question.slice(0, 100),
      choices: choices.map((c) => ({ id: c.key, label: c.label })),
      created_at: createdAt,
      env: "prod",
      _proxied: true,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

/* =============================================================
   POST: 既存フォールバック（変更なし）
   ============================================================= */
export async function POST(req: Request) {
  const origin = ORIGIN(req.url);
  const bodyText = await req.text();
  const r = await fetch(`${origin}/api/daily/generate`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie: (req.headers.get("cookie") ?? "") as string,
    },
    body: bodyText,
  });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status, headers: { "cache-control": "no-store" } });
}
