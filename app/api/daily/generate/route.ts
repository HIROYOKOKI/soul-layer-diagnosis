// app/api/daily/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";

/** スロットごとの必要選択肢数 */
const SLOT_COUNTS: Record<Slot, number> = { morning: 4, noon: 3, night: 2 };

/** テーマ×スロットの雰囲気に寄せたローカル文言 */
const LOCAL_TEXT: Record<Slot, string> = {
  morning: "朝、最初の一歩としていまのあなたに合うのはどれ？",
  noon: "昼、このあと数時間の過ごし方として近いのはどれ？",
  night: "夜、今日はどんな締めくくりが心地いい？",
};

/** デフォルト4択（必要数に応じてスライス） */
const DEFAULT_OPTIONS = (): { key: EV; label: string }[] => [
  { key: "E", label: "衝動（E）— 小さく速く動き出す" },
  { key: "V", label: "夢（V）— まだ見ぬ可能性を描く" },
  { key: "Λ", label: "選択（Λ）— 基準を決めて進む" },
  { key: "Ǝ", label: "観測（Ǝ）— 静けさの中で整える" },
];

/** スロットに寄せたフォールバック（足りない分を埋める） */
const FALLBACK_BY_SLOT: Record<Slot, { key: EV; label: string }[]> = {
  morning: [
    { key: "E", label: "直感で素早く始める" },
    { key: "V", label: "理想のイメージから動く" },
    { key: "Λ", label: "条件を一つ決めて選ぶ" },
    { key: "Ǝ", label: "一拍置いて様子を見る" },
  ],
  noon: [
    { key: "E", label: "勢いで一歩前へ進む" },
    { key: "V", label: "可能性を広げる選択をする" },
    { key: "Λ", label: "目的に沿って最短を選ぶ" },
  ],
  night: [
    { key: "Ǝ", label: "今日は観測と整理に徹する" },
    { key: "V", label: "明日に向けて静かに構想する" },
  ],
};

/** 入力の options を {key,label} の配列にサニタイズ＋重複除去＋個数補正 */
function normalizeOptions(
  arr: any,
  need: number,
  slot: Slot
): { key: EV; label: string }[] {
  const ok = new Set<EV>(["E", "V", "Λ", "Ǝ"]);
  const base = Array.isArray(arr)
    ? (arr
        .map((o) => {
          const key = typeof o?.key === "string" ? (o.key as EV) : undefined;
          const label =
            typeof o?.label === "string" ? (o.label as string) : undefined;
          return key && ok.has(key) && label ? { key, label } : null;
        })
        .filter(Boolean) as { key: EV; label: string }[])
    : [];

  // 重複除去
  const seen = new Set<EV>();
  const uniq: { key: EV; label: string }[] = [];
  for (const o of base) {
    if (seen.has(o.key)) continue;
    seen.add(o.key);
    uniq.push(o);
  }

  // 不足分はデフォルト/スロット別で補完
  const pool = [...DEFAULT_OPTIONS(), ...FALLBACK_BY_SLOT[slot]];
  for (const p of pool) {
    if (uniq.length >= need) break;
    if (!seen.has(p.key)) {
      uniq.push(p);
      seen.add(p.key);
    }
  }

  return uniq.slice(0, need);
}

export async function POST(req: Request) {
  try {
    const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];

    const body = await req.json().catch(() => ({} as any));
    const slotRaw = String(body?.slot ?? "morning").toLowerCase();
    const slot: Slot = ["morning", "noon", "night"].includes(slotRaw)
      ? (slotRaw as Slot)
      : "morning";

    const env: Env =
      body?.env === "dev" || body?.env === "prod" ? body.env : "prod";

    const t = String(body?.theme ?? "").toUpperCase();
    const theme: Theme = (THEMES.includes(t as Theme) ? t : "LIFE") as Theme;

    const need = SLOT_COUNTS[slot] ?? 4;

    // ID（例: daily-2025-11-12-morning）
    const now = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    const id = `daily-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}-${slot}`;

    // ローカル生成（質問テキストはスロットで分岐）
    const text = LOCAL_TEXT[slot];
    const options = normalizeOptions(body?.options, need, slot);

    // JSTタイムスタンプ（見やすい形式）
    const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const ts_jst = jst.toISOString().replace("T", " ").slice(0, 19);

    return NextResponse.json(
      {
        ok: true,
        id,
        slot,
        env,
        theme,
        text,
        options, // [{ key:"E|V|Λ|Ǝ", label:"..." }]
        ts: ts_jst,
        generated: "local",
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    // 失敗しても 200 で返し、フロント側のハンドリングを簡単に
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }
}
