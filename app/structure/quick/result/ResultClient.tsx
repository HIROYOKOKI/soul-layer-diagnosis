// app/structure/quick/result/ResultClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuickTypeKey = "EVΛƎ" | "EΛVƎ";

type DiagnoseRes = {
  ok: true;
  typeKey: QuickTypeKey;
  typeLabel: string;           // 例: "EVΛƎ型（未来志向型）"
  colorHex: string;            // 公式カラー（EVΛƎ=#FF4500 / EΛVƎ=#B833F5）
  order: EV[];
  points?: Record<EV, number>; // {E:3,V:2,Λ:1,Ǝ:0}（任意）
  comment: string;
  advice: string;
};

export default function ResultClient() {
  const router = useRouter();

  const [order, setOrder] = useState<EV[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<DiagnoseRes | null>(null);

  // 型カラー（最終確定値）
  const TYPE_COLORS: Record<QuickTypeKey, { text: string; ring: string; glow: string }> = {
    EVΛƎ: {
      text: "text-[#FF4500]",
      ring: "ring-[#FF4500]/50",
      glow: "shadow-[0_0_18px_#FF450033]",
    },
    EΛVƎ: {
      text: "text-[#B833F5]",
      ring: "ring-[#B833F5]/50",
      glow: "shadow-[0_0_18px_#B833F533]",
    },
  };

  /* 1) 並びの復元 */
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? sessionStorage.getItem("structure_quick_pending")
          : null;
      const p = raw ? JSON.parse(raw) : null;
      if (!p?.order || !Array.isArray(p.order) || p.order.length !== 4) {
        router.replace("/structure/quick");
      } else {
        setOrder(p.order as EV[]);
      }
    } catch {
      router.replace("/structure/quick");
    }
  }, [router]);

  /* 2) 診断 → 保存 → 直後に quick-latest をプローブ */
  useEffect(() => {
    (async () => {
      if (!order) return;
      setLoading(true);
      setError(null);
      try {
        // 診断（未来志向 or 現実思考）
        const r: DiagnoseRes | { ok: false } = await fetch("/api/structure/quick/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order, theme: "dev" }),
          cache: "no-store",
        }).then((x) => x.json());

        if (!("ok" in r) || !r.ok) {
          setError("診断に失敗しました。もう一度お試しください。");
          setLoading(false);
          return;
        }

        setRes(r);

        // ====== 自動保存（/api/structure/quick/save）======
        setSaving(true);
        const saveRes = await saveQuickResult({
          type_key: r.typeKey,
          type_label: r.typeLabel,
          order: r.order,
          points: r.points, // 任意。あれば 0–100 に正規化して score_map に変換
          env: "dev",
        });

        if (!saveRes.ok) {
          console.error("❌ QUICK SAVE FAILED:", saveRes.status, saveRes.json);
        } else {
          console.log("✅ QUICK SAVED:", saveRes.json);
          // 直後に最新1件を確認（ここで item が null ならDB未保存）
          try {
            const probe = await fetch("/api/mypage/quick-latest", { cache: "no-store" });
            const pj = await probe.json();
            console.log("🔎 quick-latest:", pj);
          } catch (e) {
            console.warn("probe quick-latest failed:", e);
          }
        }
        // ====== /自動保存 ======
      } catch (e) {
        setError("通信が不安定です。時間をおいて再度お試しください。");
      } finally {
        setSaving(false);
        setLoading(false);
      }
    })();
  }, [order]);

  const headerClass = useMemo(() => {
    if (!res) return "text-white";
    return TYPE_COLORS[res.typeKey].text;
  }, [res]);

  if (!order) return null;

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white px-5">
      <div className="w-full max-w-md py-10">
        {/* 見出し：仮を外し、型＋カラー表示 */}
        <h1 className={`text-center text-xl font-bold mb-2 ${headerClass}`}>
          診断結果：{res?.typeLabel ?? "診断中…"}
        </h1>

        {/* 並びの表示 */}
        <p className="text-white/70 text-sm mb-6">
          あなたの並び順：{order.join(" → ")}
        </p>

        {/* 本文 */}
        {loading && (
          <div className="rounded-lg border border-white/10 p-4 text-white/80">
            診断中です…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && res && (
          <div
            className={`rounded-xl border border-white/10 ring-1 ${TYPE_COLORS[res.typeKey].ring} ${TYPE_COLORS[res.typeKey].glow} bg-white/5 p-5 space-y-4`}
          >
            <div className="text-white/90 leading-relaxed">{res.comment}</div>
            <div className={`font-semibold ${headerClass}`}>{res.advice}</div>
            {saving && <div className="text-xs text-white/50">保存中…</div>}
          </div>
        )}

        {/* アクション */}
        <div className="grid gap-3 mt-8">
          <button
            className="w-full rounded-lg bg-white text-black py-2 font-bold hover:opacity-90"
            onClick={() => router.push("/mypage")}
            disabled={loading}
          >
            マイページへ
          </button>
          <button
            className="w-full rounded-lg border border-white/20 py-2 text-white/90 hover:bg-white/10 disabled:opacity-50"
            onClick={() => router.replace("/structure/quick")}
            disabled={loading}
          >
            もう一度やる
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== ここから追記：保存関数 ===== */

type SavePayload = {
  type_key: QuickTypeKey | null;
  type_label: string | null;
  order: EV[] | null;
  points?: Record<EV, number> | undefined;
  env?: "dev" | "prod";
};

/** points(0..3) → score_map(0..100) に正規化 */
function pointsToScoreMap(points?: Record<EV, number> | null) {
  if (!points) return null;
  const max = 3; // 0..3 スケール想定
  const toPct = (v: number | undefined) =>
    typeof v === "number" ? Math.max(0, Math.min(100, (v / max) * 100)) : null;
  return {
    E: toPct(points.E),
    V: toPct(points.V),
    Λ: toPct(points["Λ"]),
    Ǝ: toPct(points["Ǝ"]),
  };
}

async function saveQuickResult(payload: SavePayload): Promise<{
  ok: boolean;
  status: number;
  json: any;
}> {
  const score_map = pointsToScoreMap(payload.points) ?? null;

  const body = {
    type_key: payload.type_key,
    type_label: payload.type_label,
    order: payload.order,
    // points が無ければ score_map は null のままでOK（サーバーが order→重み付けに変換）
    score_map,
    env: payload.env ?? "dev",
  };

  try {
    const res = await fetch("/api/structure/quick/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json?.ok !== false, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: { error: String(e) } };
  }
}
