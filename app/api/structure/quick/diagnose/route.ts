// app/api/structure/quick/diagnose/route.ts
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuickTypeKey = "EVΛƎ" | "EΛVƎ"; // 未来志向 or 現実思考

// 表示ラベル
const TYPE_LABEL: Record<QuickTypeKey, string> = {
  EVΛƎ: "EVΛƎ型（未来志向型）",
  EΛVƎ: "EΛVƎ型（現実思考型）",
};

// 公式カラー（確定値）
const TYPE_COLOR_HEX: Record<QuickTypeKey, string> = {
  EVΛƎ: "#FF4500", // 未来志向
  EΛVƎ: "#B833F5", // 現実思考
};

// 各コードの基本カラー（参照用）
const CODE_COLORS: Record<EV, string> = {
  E: "#FF4500",
  V: "#1E3A8A",
  "Λ": "#84CC16",
  "Ǝ": "#B833F5",
};

// ★ 公式判定ルール（最終版）
// トップ2に E か V が1つでも入っていれば 未来志向（EVΛƎ）
// どちらも入っていなければ 現実思考（EΛVƎ）
function judgeType(order: EV[]): QuickTypeKey {
  const top2 = new Set(order.slice(0, 2));
  return (top2.has("E") || top2.has("V")) ? "EVΛƎ" : "EΛVƎ";
}

const COMMENT: Record<QuickTypeKey, string> = {
  EVΛƎ:
    "衝動（E）や可能性（V）を起点に未来へ踏み出す型。まず小さく動き、学びを回収しながら視野を広げていく。",
  EΛVƎ:
    "選択（Λ）や観測（Ǝ）を上位に置く現実思考型。目的と制約を把握し、最短で前に進む判断が得意。",
};

const ADVICE: Record<QuickTypeKey, string> = {
  EVΛƎ: "まず10分だけ着手→手応えを観測→次の一手を更新。動きながら整えよう。",
  EΛVƎ: "目的→制約→手順の3点をメモ→最短の一手を実行→結果で微修正。",
};

export async function POST(req: NextRequest) {
  try {
    const { order } = (await req.json()) as { order?: EV[]; theme?: "dev" | "prod" };

    // 入力バリデーション（4つの並び、許容コードのみ）
    const ALLOWED: EV[] = ["E", "V", "Λ", "Ǝ"];
    if (!Array.isArray(order) || order.length !== 4 || !order.every((k) => ALLOWED.includes(k))) {
      return NextResponse.json(
        { ok: false, error: "invalid_order", hint: "order は 4件の並び（E,V,Λ,Ǝ）で送ってください。" },
        { status: 400 }
      );
    }

    // 1位=3, 2位=2, 3位=1, 4位=0
    const points: Record<EV, number> = { E: 0, V: 0, "Λ": 0, "Ǝ": 0 };
    order.forEach((k, i) => { points[k] = (3 - i) as 0 | 1 | 2 | 3 });

    const typeKey = judgeType(order);
    const typeLabel = TYPE_LABEL[typeKey];

    return NextResponse.json({
      ok: true,
      typeKey,                 // "EVΛƎ" | "EΛVƎ"
      typeLabel,               // 表示用ラベル
      colorHex: TYPE_COLOR_HEX[typeKey],
      order,
      points,
      codeColors: CODE_COLORS, // 参考：各コード色
      comment: COMMENT[typeKey],
      advice: ADVICE[typeKey],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown_error" }, { status: 500 });
  }
}
