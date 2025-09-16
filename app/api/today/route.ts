// app/api/today/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 動的に毎回計算させる
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScoreJson = Partial<Record<"E" | "V" | "L" | "Λ" | "Eexists" | "Ǝ", number>>;
type DailyRow = {
  created_at: string;
  structure_score: ScoreJson | null;
  code: string | null;
  comment: string | null;
};

function normalizeScores(j: ScoreJson | null | undefined) {
  const E = Number(j?.E ?? 0);
  const V = Number(j?.V ?? 0);
  const L = Number(j?.L ?? j?.["Λ"] ?? 0);
  const Eexists = Number(j?.Eexists ?? j?.["Ǝ"] ?? 0);
  return { E, V, L, Eexists };
}

function fallbackResponse() {
  return NextResponse.json(
    {
      scores: { E: 0.65, V: 0.8, L: 0.45, Eexists: 0.7 },
      latest: {
        code: "Ǝ",
        text: "静かに観測を整えるタイミング。",
        date: new Date().toISOString().slice(0, 10),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  // サーバ専用：URL/KEY を複数候補から解決（ローカル/本番で名称差があっても動く）
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || // あるなら最強（RLSを跨げる）※サーバだけで使う
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) return fallbackResponse();

  // セッションは使わない読み取り専用
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data, error } = await supabase
      .from("daily_results")
      .select("created_at, structure_score, code, comment")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return fallbackResponse();

    const row = (data as DailyRow | null) ?? null;
    const scores = normalizeScores(row?.structure_score);
    const latest = {
      code: row?.code ?? "Ǝ",
      text: row?.comment ?? "—",
      date: (row?.created_at ?? new Date().toISOString()).slice(0, 10),
    };

    return NextResponse.json(
      { scores, latest },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return fallbackResponse();
  }
}

