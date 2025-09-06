// /app/api/series/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================== 型 ================== */
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type SeriesRow = { created_at: string; structure_score: ScoreJson | null };
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number };

/* ================== ユーティリティ ================== */
// 数値なら 0..1 にクランプ、未定義は未定義のまま返す
const clamp01Opt = (v: unknown): number | undefined => {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(1, v));
};

// フォールバック用（必ず数値を返す）
const clamp01 = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

function clampDays(d: number): number {
  if (Number.isNaN(d)) return 30;
  return Math.max(1, Math.min(365, Math.floor(d)));
}

// 未定義は未定義のまま返す（ここで 0 に落とさない！）
function normalizeScores(j: ScoreJson | null | undefined) {
  return {
    E: clamp01Opt(j?.E),
    V: clamp01Opt(j?.V),
    L: clamp01Opt(j?.L ?? j?.["Λ"]),
    Eexists: clamp01Opt(j?.Eexists ?? j?.["Ǝ"]),
  } as { E?: number; V?: number; L?: number; Eexists?: number };
}

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * 欠損日を days 件に埋める。
 * - キーごとに「未定義なら前日の定義済み値」を使う
 * - それでも未定義なら 0 で初期化
 */
function fillDays(
  days: number,
  rows: { date: string; E?: number; V?: number; L?: number; Eexists?: number }[]
): SeriesPoint[] {
  const today = new Date();
  const byDate = new Map<string, { E?: number; V?: number; L?: number; Eexists?: number }>();
  for (const r of rows) byDate.set(r.date, r);

  const out: SeriesPoint[] = [];
  let last: { E?: number; V?: number; L?: number; Eexists?: number } = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);

    const cur = byDate.get(key) ?? {};
    const E = clamp01Opt(cur.E ?? last.E) ?? 0;
    const V = clamp01Opt(cur.V ?? last.V) ?? 0;
    const L = clamp01Opt(cur.L ?? last.L) ?? 0;
    const Eexists = clamp01Opt(cur.Eexists ?? last.Eexists) ?? 0;

    out.push({ date: key, E, V, L, Eexists });
    // 次日のために「定義済みだけ」更新
    last = {
      E: cur.E ?? last.E ?? 0,
      V: cur.V ?? last.V ?? 0,
      L: cur.L ?? last.L ?? 0,
      Eexists: cur.Eexists ?? last.Eexists ?? 0,
    };
  }
  return out;
}

// days 件返すフォールバック
function fallbackRows(days: number): SeriesPoint[] {
  const today = new Date();
  const out: SeriesPoint[] = [];
  let last: SeriesPoint | null = null;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const gen = {
      date: dateKey(d),
      E: clamp01(Math.random()),
      V: clamp01(Math.random()),
      L: clamp01(Math.random()),
      Eexists: clamp01(Math.random()),
    };
    const smooth = last
      ? {
          date: gen.date,
          E: clamp01((gen.E + last.E) / 2),
          V: clamp01((gen.V + last.V) / 2),
          L: clamp01((gen.L + last.L) / 2),
          Eexists: clamp01((gen.Eexists + last.Eexists) / 2),
        }
      : gen;
    out.push(smooth);
    last = smooth;
  }
  return out;
}

/* ================== Handler ================== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = clampDays(parseInt(searchParams.get("days") ?? "30", 10));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  // env 未設定時：必ず days 件返す
  if (!url || !key) return NextResponse.json(fallbackRows(days));

  const supabase = createClient(url, key);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("daily_results")
      .select("created_at, structure_score")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 生データ → 未定義保持の正規化
    const normRows = ((data ?? []) as SeriesRow[]).map((d) => ({
      date: d.created_at.slice(0, 10),
      ...normalizeScores(d.structure_score),
    }));

    // days 件に埋めて返す（FFill → 0）
    const filled = fillDays(days, normRows);
    return NextResponse.json(filled);
  } catch (_err) {
    return NextResponse.json(fallbackRows(days));
  }
}
