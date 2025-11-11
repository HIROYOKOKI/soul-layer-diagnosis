// =============================================================
// app/api/daily/question/route.ts（JSTスロット確定版）
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
function getJstHour(): number {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(hourStr, 10);
}
function getJstSlot(): Slot {
  const h = getJstHour();
  if (h >= 5 && h < 12) return "morning"; // 05:00-11:59
  if (h >= 12 && h < 18) return "noon";   // 12:00-17:59
  return "night";                          // 18:00-04:59
}
function seedFromUUID(uuid: string): number {
  const head = uuid.replace(/-/g, "").slice(0, 8);
  return Number.parseInt(head, 16) >>> 0;
}

/* =============================================================
   GET: 質問生成（LUNEA_SYSTEM_PROMPT_FOR(name)を使用）
   ============================================================= */
export async function GET(req: Request) {
  const origin = ORIGIN(req.url);
  const url = new URL(req.url);
  const cookieHeader = (req.headers.get("cookie") ?? "") as string;

  // 1) ユーザー名
  const userName = await getUserName();

  // 2) テーマ取得（/api/theme）
  let theme: Theme = "LOVE";
  try {
    const r = await fetch(`${origin}/api/theme`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    const j = await r.json().catch(() => ({}));
    const t = String(j?.scope ?? j?.theme ?? "LOVE").toUpperCase();
    if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(t)) theme = t as Theme;
  } catch { /* noop */ }

  // 3) スロット（クエリで明示指定があれば優先。なければJSTに従う）
  const slotQ = url.searchParams.get("slot");
  const slot: Slot =
    slotQ === "morning" || slotQ === "noon" || slotQ === "night"
      ? (slotQ as Slot)
      : getJstSlot();

  const need = NEED(slot);

  // 4) OpenAIで質問生成（失敗時は /api/daily/generate をフォールバック）
  let text = "";
  let options: { key?: string; label?: string }[] = [];

  try {
    const client = new OpenAI(); // ← トップレベルnewは禁止なので関数内で生成
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
    // フォールバック：内部APIに委譲
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
    } catch { /* noop */ }
  }

  // 5) 選択肢フォールバック（数/ラベルを補正）
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

  // 6) メタ・Cookie保存
  const questionId = crypto.randomUUID();
  const seed = seedFromUUID(questionId);
  const createdAt = new Date().toISOString();
  const question =
    (text?.trim() as string) ||
    (slot === "morning"
      ? "今のあなたに必要な最初の一歩はどれ？"
      : slot === "noon"
      ? "このあと数時間で進めたい進路は？"
      : "今日はどんな締めくくりが心地いい？");

  const jar = cookies();
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
   POST: フォールバック委譲（変更なし）
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
  return NextResponse.json(j, {
    status: r.status,
    headers: { "cache-control": "no-store" },
  });
}
