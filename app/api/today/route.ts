// /app/api/today/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---- 型 ----
type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type DailyRow = {
  created_at: string;
  structure_score: ScoreJson | null;
  code: string | null;
  comment: string | null;
};

// ---- ヘルパー ----
function normalizeScores(j: ScoreJson | null | undefined) {
  const E = Number(j?.E ?? 0);
  const V = Number(j?.V ?? 0);
  const L = Number(j?.L ?? j?.["Λ"] ?? 0);
  const Eexists = Number(j?.Eexists ?? j?.["Ǝ"] ?? 0);
  return { E, V, L, Eexists };
}

function fallbackResponse() {
  return NextResponse.json({
    scores: { E: 0.65, V: 0.8, L: 0.45, Eexists: 0.7 },
    latest: {
      code: "Ǝ",
      text: "静かに観察したい",
      date: new Date().toISOString().slice(0, 10),
    },
  });
}

// ---- Handler ----
export async function GET() {
  // 環境変数が無い場合はダミーで返す（ビルドを落とさない）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackResponse();

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase
      .from("daily_results")
      .select("created_at, structure_score, code, comment")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<DailyRow>();

    if (error) throw error;

    const scores = normalizeScores(data?.structure_score);
    const latest = {
      code: data?.code ?? "Ǝ",
      text: data?.comment ?? "—",
      date: (data?.created_at ?? new Date().toISOString()).slice(0, 10),
    };

    return NextResponse.json({ scores, latest });
  } catch (_err) {
    return fallbackResponse();
  }
}
