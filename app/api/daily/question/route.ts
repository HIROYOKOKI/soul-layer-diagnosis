// app/api/daily/question/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
type Slot = "morning" | "noon" | "night";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type EV = "E" | "V" | "Λ" | "Ǝ";

/* ===== フォールバック ===== */
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

/* ===== JSTスロット（Asia/Tokyoを厳密指定） ===== */
function getJstSlot(now = new Date()): Slot {
  const hourFmt = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  });
  const h = Number(hourFmt.format(now)); // 0..23（JST）
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}

function seedFromUUID(uuid: string): number {
  const head = uuid.replace(/-/g, "").slice(0, 8);
  return Number.parseInt(head, 16) >>> 0;
}

export async function GET(req: Request) {
  const origin = ORIGIN(req.url);
  const jar = cookies();

  // 1) テーマ（MyPageと同期）
  let theme: Theme = "LOVE";
  try {
    const r = await fetch(`${origin}/api/theme`, {
      cache: "no-store",
      headers: { cookie: (req.headers.get("cookie") ?? "") as string },
    });
    const j = await r.json().catch(() => ({}));
    const t = String(j?.scope ?? j?.theme ?? "LOVE").toUpperCase();
    if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(t)) theme = t as Theme;
  } catch {
    /* noop */
  }

  // 2) JSTスロット
  const slot = getJstSlot();
  const need = NEED(slot);

  // 3) /api/daily/generate に委譲（Cookie引き継ぎ）
  let text = "";
  let options: { key?: string; label?: string }[] = [];
  try {
    const r = await fetch(`${origin}/api/daily/generate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: (req.headers.get("cookie") ?? "") as string,
      },
      body: JSON.stringify({ slot, theme }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok) {
      text = String(j.text ?? "");
      options = Array.isArray(j.options) ? j.options : [];
      const patched = String(j.theme ?? "").toUpperCase();
      if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(patched))
        theme = patched as Theme;
    }
  } catch {
    /* noop */
  }

  // 4) 強制フォールバック：必ず 2..4 件にする
  const keys: EV[] = ["E", "V", "Λ", "Ǝ"];
  let choices = (options || [])
    .slice(0, need)
    .map((o, i) => {
      const k = keys.includes(o?.key as EV) ? (o!.key as EV) : (keys[i] as EV);
      const label = (o?.label ?? "").toString().trim();
      return { key: k, label };
    })
    .filter((c) => c.label);

  // 足りない分は FALLBACK で補完
  const have = new Set(choices.map((c) => c.key));
  for (const c of FALLBACK[slot]) {
    if (choices.length >= need) break;
    if (!have.has(c.key)) {
      choices.push(c);
      have.add(c.key);
    }
  }
  // それでも空なら丸ごと差し替え
  if (choices.length === 0) choices = FALLBACK[slot].slice(0, need);
  if (choices.length > need) choices = choices.slice(0, need);

  // 5) 旧レスポンス形へ
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

  // Cookie（互換）
  jar.set("daily_question_id", questionId, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set("daily_slot", slot, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set("daily_theme", theme, { httpOnly: true, sameSite: "lax", path: "/" });

  return NextResponse.json(
    {
      ok: true,
      question_id: questionId,
      seed,
      slot,
      theme,
      question: question.slice(0, 100),
      choices: choices.map((c) => ({ id: c.key, label: c.label })), // 必ず 2..4 件
      created_at: createdAt,
      env: "prod",
      _proxied: true,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

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
