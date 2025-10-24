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
function toJstDateString(d: string | Date) {
  const dt = new Date(d);
  return new Date(dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })).toDateString();
}
function seedFromUUID(uuid: string): number {
  const head = uuid.replace(/-/g, "").slice(0, 8);
  return Number.parseInt(head, 16) >>> 0;
}

/* ====== 合成ユーティリティ ====== */
type Vec = { E: number; V: number; L: number; Ze: number }; // 0..100

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

/** テーマ→バイアス（軽量・可逆） */
function themeVector(theme: Theme): Vec {
  // 中庸: 25ずつをベースに +/−10 の範囲で微傾斜
  switch (theme) {
    case "WORK":   return { E: 30, V: 20, L: 35, Ze: 15 };
    case "LOVE":   return { E: 20, V: 40, L: 20, Ze: 20 };
    case "FUTURE": return { E: 28, V: 38, L: 18, Ze: 16 };
    case "LIFE":   return { E: 23, V: 27, L: 23, Ze: 27 };
  }
}

/** ゼロベクトル */
const ZERO: Vec = { E: 0, V: 0, L: 0, Ze: 0 };

/** 加算 */
function add(a: Vec, b: Vec): Vec {
  return { E: a.E + b.E, V: a.V + b.V, L: a.L + b.L, Ze: a.Ze + b.Ze };
}
/** スカラー倍 */
function mul(a: Vec, k: number): Vec {
  return { E: a.E * k, V: a.V * k, L: a.L * k, Ze: a.Ze * k };
}
/** 正規化（0..100） */
function normFinal(v: Vec): Vec {
  return { E: clamp100(v.E), V: clamp100(v.V), L: clamp100(v.L), Ze: clamp100(v.Ze) };
}

export async function GET(req: Request) {
  const origin = ORIGIN(req.url);
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const jar = cookies();
  const cookieHeader = (req.headers.get("cookie") ?? "") as string;

  // 1) テーマ
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

  // 2) JSTスロット
  const slot = getJstSlot();
  const need = NEED(slot);

  // 3) /api/daily/generate へ委譲
  let text = "";
  let options: { key?: string; label?: string }[] = [];
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
      const patched = String(j.theme ?? "").toUpperCase();
      if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(patched))
        theme = patched as Theme;
    }
  } catch {}

  // 4) 選択肢フォールバック
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

  // 5) IDなど
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

  // 6) debug: 最新データ & 合成スコア
  let debugPayload: any | null = null;
  if (debug) {
    try {
      const [q, d, p] = await Promise.all([
        fetch(`${origin}/api/mypage/quick-latest`,   { cache: "no-store", headers: { cookie: cookieHeader } }).then(r => r.json()).catch(() => null),
        fetch(`${origin}/api/mypage/daily-latest`,   { cache: "no-store", headers: { cookie: cookieHeader } }).then(r => r.json()).catch(() => null),
        fetch(`${origin}/api/mypage/profile-latest`, { cache: "no-store", headers: { cookie: cookieHeader } }).then(r => r.json()).catch(() => null),
      ]);

      const quick = q?.item ?? null;
      const daily = d?.item ?? null;
      const profile = p?.item ?? null;

      // ---- 入力ベクトル抽出
      const vTheme: Vec = themeVector(theme);
      const vDaily: Vec | null = fromScoreMap(daily?.score_map);
      // プロフィールにベクトルが無い想定のため null（将来、profile_scores 等があれば拾う）
      const vProfile: Vec | null = fromScoreMap((profile as any)?.score_map) ?? null;
      // クイックは型のみのため既定は使用しない（必要なら軽バイアスを与える）
      const vQuick: Vec | null = null;

      // ---- 重み（あなたの既定）
      const weights = {
        profile: 1.0,
        theme:   0.5,
        daily:   0.1,
        weekly:  0.5,   // まだ未使用
        monthly: 1.5,   // まだ未使用
        quick:   0.0,   // 既定は使わない（必要あれば上げる）
      };

      // ---- 合成
      const parts: { key: keyof typeof weights; vec: Vec | null }[] = [
        { key: "profile", vec: vProfile },
        { key: "theme",   vec: vTheme   },
        { key: "daily",   vec: vDaily   },
        { key: "quick",   vec: vQuick   },
      ];

      let acc = ZERO;
      let wsum = 0;
      const used: Record<string, number> = {};
      for (const p of parts) {
        const w = weights[p.key];
        if (p.vec && w > 0) {
          acc = add(acc, mul(p.vec, w));
          wsum += w;
          used[p.key] = w;
        }
      }
      // 使用した重みの合計で割って 0..100 に丸め
      const combined: Vec = wsum > 0 ? normFinal(mul(acc, 1 / wsum)) : normFinal(acc);

      debugPayload = {
        theme,
        today_jst: toJstDateString(new Date()),
        quick_latest: quick,
        daily_latest: daily,
        profile_latest: profile,
        vectors: {
          theme: vTheme,
          daily: vDaily,
          profile: vProfile,
          quick: vQuick,
        },
        weights_used: used,
        combined, // ★ 合成スコア（0..100）
      };
    } catch {
      debugPayload = { theme, today_jst: toJstDateString(new Date()) };
    }
  }

  // 7) レスポンス
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
      ...(debug && { debug: debugPayload }),
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
