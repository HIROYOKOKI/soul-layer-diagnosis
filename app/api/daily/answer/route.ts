// app/api/daily/answer/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

// Supabase（存在すれば保存に使う／無ければスキップ）
let getSupabaseAdmin: (() => any) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getSupabaseAdmin = require("@/lib/supabase-admin").getSupabaseAdmin;
} catch {
  getSupabaseAdmin = null;
}

type EV = "E" | "V" | "Λ" | "Ǝ";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type DailyAnswerRequest = {
  seed?: number;
  choiceId?: string;                // "E" | "V" | "Λ" | "Ǝ" を想定
  slot?: "morning" | "noon" | "night";
  theme?: Theme;
};

type DailyAnswerResponse =
  | {
      ok: true;
      code: EV;
      score: number;
      comment: string;
      advice: string;
      affirm: string;
      env?: "dev" | "prod";
    }
  | { ok: false; error: string };

const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_scope";

// theme 解決（body > query > cookie > LIFE）
function pickTheme(req: NextRequest, bodyTheme?: Theme): Theme {
  const q = (req.nextUrl.searchParams.get("theme") || "").toUpperCase() as Theme;
  if (bodyTheme && THEMES.includes(bodyTheme)) return bodyTheme;
  if (q && THEMES.includes(q)) return q;
  const c = (cookies().get(SCOPE_COOKIE)?.value || "").toUpperCase() as Theme;
  return c && THEMES.includes(c) ? c : "LIFE";
}

// スコアを 70〜100 で安定生成
function scoreFromSeed(seed?: number, bias = 0): number {
  const s = typeof seed === "number" ? seed : Math.floor(Math.random() * 1e9);
  const v = (s % 31) + 70 + bias;
  return Math.max(70, Math.min(100, v));
}

const COMMENT: Record<Theme, Record<EV, string>> = {
  WORK: {
    E: "勢いの良さが今日の仕事を前に進めます。小さく速く始めるほど、波に乗れます。",
    V: "理想像を先に描くほど集中が高まります。完成形から逆算して一歩を選んで。",
    Λ: "基準を一つに絞ると判断がブレません。今日は“最短”を選ぶ練習日。",
    Ǝ: "少し離れて観測するほど整います。ノートに3行、気づきを残しましょう。",
  },
  LOVE: {
    E: "素直な一言が相手の心を温めます。考えすぎる前に“ありがとう”を。",
    V: "二人の理想の一場面を言葉に。共有するだけで歩幅が揃います。",
    Λ: "大事にしたい約束を一つだけ。選択の明確さが安心を生みます。",
    Ǝ: "相手の表情を観測してみて。沈黙にも意味が宿る夜です。",
  },
  FUTURE: {
    E: "衝動は未来の扉を叩く合図。小さな実験を今日のうちに。",
    V: "可能性は言語化で広がる。仮説を一文で書き出そう。",
    Λ: "決めるほど道が現れる。締切と一歩目を同時に決める日。",
    Ǝ: "観測が未来を変える。今日の出来事を一枚の写真で残して。",
  },
  LIFE: {
    E: "体を動かすと心が整う。3分ストレッチからはじめよう。",
    V: "暮らしの理想を一つ。香り・光・音のどれかを整えてみて。",
    Λ: "選択はシンプルに。“やらないこと”を一つ決めるだけで軽くなる。",
    Ǝ: "今日は呼吸と観測の日。深呼吸3回、静けさに耳を澄ませて。",
  },
};

const ADVICE: Record<EV, string> = {
  E: "“小さい×早い×反復”が最強。5分だけ動く→結果を観測のループを回して。",
  V: "言葉にした理想は現実を引き寄せます。1行のメモでも十分です。",
  Λ: "選択基準を1つに。迷いは減り、集中は増えます。",
  Ǝ: "一歩引く勇気が質を上げます。メモと休息が明日を作る。",
};

const AFFIRM: Record<EV, string> = {
  E: "私は小さく速く動ける。",
  V: "私は可能性を言葉にできる。",
  Λ: "私は迷いなく選べる。",
  Ǝ: "私は静けさから整えられる。",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DailyAnswerRequest;

    // choice → EV 正規化
    const raw = String(body?.choiceId ?? "").toUpperCase();
    const ev: EV = (["E", "V", "Λ", "Ǝ"] as const).includes(raw as EV) ? (raw as EV) : "Ǝ";

    // theme 決定
    const theme = pickTheme(req, body.theme);

    // スコア
    const score = scoreFromSeed(body?.seed, ev === "E" ? 2 : ev === "Λ" ? 1 : 0);

    // UI文面
    const comment = COMMENT[theme][ev];
    const advice = ADVICE[ev];
    const affirm = AFFIRM[ev];

    // Supabase 保存（あれば）
    if (getSupabaseAdmin) {
      try {
        const sb = getSupabaseAdmin!();
        if (sb) {
          await sb.from("daily_results").insert({
            slot: body?.slot ?? null,
            theme: theme.toLowerCase(),
            code: ev,
            score,
            comment,
            advice,
            affirm,
          });
        }
      } catch {
        // 保存失敗は無視（APIは成功を返す）
      }
    }

    const res: DailyAnswerResponse = {
      ok: true,
      code: ev,
      score,
      comment,
      advice,
      affirm,
      env: "prod",
    };
    return NextResponse.json(res, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown_error" } as DailyAnswerResponse,
      { status: 500 }
    );
  }
}
