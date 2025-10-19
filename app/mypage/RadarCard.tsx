"use client";

import { useEffect, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";

type Scores = { E: number; V: number; L: number; Z: number }; // Λ→L, Ǝ→Z として扱う

type ApiQuickLatest = {
  ok: boolean;
  item: null | {
    // フィールド名は環境に合わせてここで吸収
    e?: number; v?: number; lambda?: number; epsilon?: number;
    E?: number; V?: number; L?: number; Z?: number;
    score_e?: number; score_v?: number; score_lambda?: number; score_epsilon?: number;
    created_at?: string;
    theme?: string;
  };
};

function normalizeScores(src: any): Scores | null {
  if (!src) return null;
  // 候補名を順に吸収（0〜100 でも 0〜1 でもOK、後で正規化）
  const E = src.E ?? src.e ?? src.score_e ?? 0;
  const V = src.V ?? src.v ?? src.score_v ?? 0;
  const L = src.L ?? src.lambda ?? src.score_lambda ?? 0;
  const Z = src.Z ?? src.epsilon ?? src.score_epsilon ?? 0;

  const arr = [E, V, L, Z].map(Number);
  if (arr.every(n => isFinite(n))) {
    // 0〜1 or 0〜100 を 0〜100 に寄せる
    const looksLikeUnit = arr.every(n => n <= 1.0001);
    const scaled = looksLikeUnit ? arr.map(n => n * 100) : arr;
    return { E: scaled[0], V: scaled[1], L: scaled[2], Z: scaled[3] };
  }
  return null;
}

export default function RadarCard() {
  const [scores, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // まず Quick の最新
        let r = await fetch("/api/mypage/quick-latest", { cache: "no-store" });
        let j: ApiQuickLatest = await r.json();

        // 無ければ Daily にフォールバック（任意）
        if (!j?.item) {
          const r2 = await fetch("/api/mypage/daily-latest", { cache: "no-store" });
          const j2 = await r2.json();
          const s2 = normalizeScores(j2?.item);
          setScores(s2);
        } else {
          const s1 = normalizeScores(j.item);
          setScores(s1);
        }
      } catch {
        setScores(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = scores
    ? [
        { axis: "E（衝動）", value: scores.E },
        { axis: "V（可能性）", value: scores.V },
        { axis: "Λ（選択）", value: scores.L },
        { axis: "Ǝ（観測）", value: scores.Z },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-lg font-semibold">構造バランス（EVΛƎ）</h3>
        {!loading && !scores && <span className="text-sm text-white/60">まだデータがありません</span>}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="EVΛƎ" dataKey="value" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-white/70">
        最新の診断からスコアを可視化。0〜100で相対表示（0〜1形式のデータも自動正規化）。
      </p>
    </div>
  );
}
