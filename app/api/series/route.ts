// app/api/series/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* 動的API（毎回計算） */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===== 型 ===== */
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type SeriesRow = { created_at: string; structure_score: ScoreJson | null };
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number };

/* ===== util ===== */
const clamp01 = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};
const clamp01Opt = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : undefined;

const dateKey = (d: Date) => d.toISOString().slice(0, 10);
const daysClamp = (d: number) => (Number.isNaN(d) ? 30 : Math.max(7, Math.min(90, Math.floor(d))));

function normalizeScores(j: ScoreJson | null | undefined) {
  return {
    E: clamp01Opt(j?.E),
    V: clamp01Opt(j?.V),
    L: clamp01Opt(j?.L ?? j?.["Λ"]),
    Eexists: clamp01Opt(j?.Eexists ?? j?.["Ǝ"]),
  } as { E?: number; V?: number; L?: number; Eexists?: number };
}

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
    last = {
      E: cur.E ?? last.E ?? 0,
      V: cur.V ?? last.V ?? 0,
      L: cur.L ?? last.L ?? 0,
      Eexists: cur.Eexists ?? last.Eexists ?? 0,
    };
  }
  return out;
}

function fallbackRows(days: number): SeriesPoint[] {
  const today = new Date();
  const out: SeriesPoint[] = [];
  let last: SeriesPoint | null = null;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const gen: SeriesPoint = {
      date: dateKey(d),
      E: clamp01(Math.random()),
      V: clamp01(Math.random()),
      L: clamp01(Math.random()),
      Eexists: clamp01(Math.random()),
    };
    out.push(
      last
        ? {
            date: gen.date,
            E: clamp01((gen.E + last.E) / 2),
            V: clamp01((gen.V + last.V) / 2),
            L: clamp01((gen.L + last.L) / 2),
            Eexists: clamp01((gen.Eexists + last.Eexists) / 2),
          }
        : gen
    );
    last = out[out.length - 1];
  }
  return out;
}

/* ===== Handler ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = daysClamp(parseInt(searchParams.get("days") ?? "30", 10));

  // env を冗長に解決（本番/ローカルで名前差があっても拾う）
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || // サーバ専用（使えればRLSを跨げる）
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  // env 未設定 or 一時障害でも “必ず days 件” 返す
  if (!url || !key) {
    return NextResponse.json(fallbackRows(days), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("daily_results")
      .select("created_at, structure_score")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(fallbackRows(days), { headers: { "Cache-Control": "no-store" } });
    }

    const normRows = ((data ?? []) as SeriesRow[]).map((d) => ({
      date: d.created_at.slice(0, 10),
      ...normalizeScores(d.structure_score),
    }));

    const filled = fillDays(days, normRows);
    return NextResponse.json(filled, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(fallbackRows(days), { headers: { "Cache-Control": "no-store" } });
  }
}
