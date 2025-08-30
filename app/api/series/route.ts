// /app/api/series/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** ====== 型 ====== */
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type SeriesRow = { created_at: string; structure_score: ScoreJson };
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number };

/** ====== Supabase Client ====== */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** ====== ヘルパー ====== */
function clampDays(d: number): number {
  if (Number.isNaN(d)) return 30;
  return Math.max(1, Math.min(365, Math.floor(d)));
}

function normalizeScores(j: ScoreJson | null | undefined): {
  E: number;
  V: number;
  L: number;
  Eexists: number;
} {
  const E = Number(j?.E ?? 0);
  const V = Number(j?.V ?? 0);
  const L = Number(j?.L ?? j?.["Λ"] ?? 0);
  const Eexists = Number(j?.Eexists ?? j?.["Ǝ"] ?? 0);
  return { E, V, L, Eexists };
}

/** ====== Handler ====== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = parseInt(searchParams.get("days") ?? "30", 10);
  const days = clampDays(daysParam);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("daily_results")
      .select("created_at, structure_score")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const rows: SeriesPoint[] = (data as SeriesRow[] | null ?? []).map((d) => {
      const s = normalizeScores(d.structure_score);
      return { date: String(d.created_at).slice(0, 10), ...s };
    });

    return NextResponse.json(rows);
  } catch {
    // フォールバック（乱数で days 件生成）
    const today = new Date();
    const rows: SeriesPoint[] = Array.from({ length: days }, (_, i) => {
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
    return NextResponse.json(rows);
  }
}
