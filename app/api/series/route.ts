// /app/api/series/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---- 型 ----
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type SeriesRow = { created_at: string; structure_score: ScoreJson | null };
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number };

// ---- ユーティリティ ----
function clampDays(d: number): number {
  if (Number.isNaN(d)) return 30;
  return Math.max(1, Math.min(365, Math.floor(d)));
}
function normalizeScores(j: ScoreJson | null | undefined) {
  const E = Number(j?.E ?? 0);
  const V = Number(j?.V ?? 0);
  const L = Number(j?.L ?? j?.["Λ"] ?? 0);
  const Eexists = Number(j?.Eexists ?? j?.["Ǝ"] ?? 0);
  return { E, V, L, Eexists };
}
function fallbackRows(days: number): SeriesPoint[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      E: Math.random(),
      V: Math.random(),
      L: Math.random(),
      Eexists: Math.random(),
    };
  });
}

// ---- Handler ----
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = clampDays(parseInt(searchParams.get("days") ?? "30", 10));

  // env 未設定ならフォールバックで返す（ビルドを落とさない）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
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

    const rows: SeriesPoint[] = ((data ?? []) as SeriesRow[]).map((d) => {
      const s = normalizeScores(d.structure_score);
      return { date: d.created_at.slice(0, 10), ...s };
    });

    return NextResponse.json(rows);
  } catch (_err) {
    return NextResponse.json(fallbackRows(days));
  }
}
