// app/api/daily/question/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Slot = "morning" | "noon" | "night";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type EV = "E" | "V" | "Λ" | "Ǝ";

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

function getOriginFrom(reqUrl: string) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(reqUrl).origin;
}
function getJstSlot(now = new Date()): Slot {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = jst.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}
function hashUUIDtoInt(uuid: string): number {
  const head = uuid.replace(/-/g, "").slice(0, 8);
  return Number.parseInt(head, 16) >>> 0;
}

export async function GET(req: Request) {
  const jar = cookies();
  const origin = getOriginFrom(req.url);
  const slot = getJstSlot();
  const needed = slot === "morning" ? 4 : slot === "noon" ? 3 : 2;

  // 1) テーマ（MyPageと同期）
  let theme: Theme = "LOVE";
  try {
    const rt = await fetch(`${origin}/api/theme`, {
      cache: "no-store",
      headers: { cookie: (req.headers.get("cookie") ?? "") as string },
    });
    if (rt.ok) {
      const jt = await rt.json();
      const t = String(jt?.scope ?? jt?.theme ?? "LOVE").toUpperCase();
      if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(t)) theme = t as Theme;
    }
  } catch { /* noop */ }

  // 2) generate に委譲
  let genText = "";
  let genOptions: { key?: string; label?: string }[] = [];
  try {
    const rg = await fetch(`${origin}/api/daily/generate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: (req.headers.get("cookie") ?? "") as string,
      },
      body: JSON.stringify({ slot, theme }),
    });
    const jg = await rg.json();
    if (rg.ok && jg?.ok) {
      genText = String(jg.text ?? "");
      genOptions = Array.isArray(jg.options) ? jg.options : [];
      // API側で補正された theme が来たら揃えておく
      if (jg.theme) {
        const t = String(jg.theme).toUpperCase();
        if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(t)) theme = t as Theme;
      }
    }
  } catch { /* noop */ }

  // 3) 強制フォールバック（必ず needed 件を満たす）
  const keys: EV[] = ["E", "V", "Λ", "Ǝ"];
  let choices = (genOptions || [])
    .slice(0, needed)
    .map((o, i) => {
      const k = keys.includes(o?.key as EV) ? (o!.key as EV) : (keys[i] as EV);
      const label = (o?.label ?? "").toString().trim();
      return { key: k, label };
    })
    .filter((c) => c.label); // ラベル空は除外

  // 足りない分は必ず埋める（重複キーがあってもラベル優先で上書き）
  const have = new Set(choices.map((c) => c.key));
  for (const c of FALLBACK[slot]) {
    if (choices.length >= needed) break;
    if (!have.has(c.key)) {
      choices.push(c);
      have.add(c.key);
    }
  }
  // それでもゼロなら丸ごと差し替え（最悪ケースの保険）
  if (choices.length === 0) {
    choices = FALLBACK[slot].slice(0, needed);
  } else if (choices.length > needed) {
    choices = choices.slice(0, needed);
  }

  // 4) 旧レスポンス形に変換
  const questionId = crypto.randomUUID();
  const seed = hashUUIDtoInt(questionId);
  const createdAt = new Date().toISOString();
  const question =
    genText?.trim() ||
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
      choices: choices.map((c) => ({ id: c.key, label: c.label })), // ← 必ず 2〜4 件
      created_at: createdAt,
      env: "prod",
      _proxied: true,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

// POST も透過プロキシしておく（旧実装互換）
export async function POST(req: Request) {
  const origin = getOriginFrom(req.url);
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
