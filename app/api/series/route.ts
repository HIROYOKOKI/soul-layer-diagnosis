// /app/api/series/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---- 型 ----
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type SeriesRow = { created_at: string; structure_score: ScoreJson | null };
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number };

// ---- ユーティリティ ----
const clamp01 = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

function clampDays(d: number): number {
  if (Number.isNaN(d)) return 30;
  return Math.max(1, Math.min(365, Math.floor(d)));
}
function normalizeScores(j: ScoreJson | null | undefined) {
  const E = clamp01(j?.E);
  const V = clamp01(j?.V);
  const L = clamp01(j?.L ?? j?.["Λ"]);
  const Eexists = clamp01(j?.Eexists ?? j?.["Ǝ"]);
  return { E, V, L, Eexists };
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// 欠損日を days 件に埋める（前方補完 → 0 初期化）
function fillDays(days: number, rows: { date: string; E: number; V: number; L: number; Eexists: number }[]): SeriesPoint[] {
  const today = new Date();
  const byDate = new Map<string, SeriesPoint>();
  for (const r of rows) byDate.set(r.date, r);

  const out: SeriesPoint[] = [];
  let last: SeriesPoint | null = null;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);

    const found = byDate.get(key);
    if (found) {
      const clamped = {
        date: key,
        E: clamp01(found.E),
        V: clamp01(found.V),
        L: clamp01(found.L),
        Eexists: clamp01(found.Eexists),
      };
      out.push(clamped);
      last = clamped;
    } else {
      const base = last ?? { date: key, E: 0, V: 0, L: 0, Eexists: 0 };
      out.push({ date: key, E: base.E, V: base.V, L: base.L, Eexists: base.Eexists });
    }
  }
  return out;
}

// ---- フォールバック生成（常に days 件返す）----
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
    // 適度にスムージング
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

// ---- Handler ----
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = clampDays(parseInt(searchParams.get("days") ?? "30", 10));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    // 必ず days 件返す
    return NextResponse.json(fallbackRows(days));
  }

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

    // 生データ → 正規化
    const rows = ((data ?? []) as SeriesRow[]).map((d) => {
      const s = normalizeScores(d.structure_score);
      return { date: d.created_at.slice(0, 10), ...s };
    });

    // days 件に埋めて返す
    const filled = fillDays(days, rows);
    return NextResponse.json(filled);
  } catch (_err) {
    return NextResponse.json(fallbackRows(days));
  }
}
