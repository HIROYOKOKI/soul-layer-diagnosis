// components/charts/Charts.tsx
"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart as RcRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

export type EV = "E" | "V" | "Λ" | "Ǝ";
export type EVAEVector = { E?: number; V?: number; "Λ"?: number; "Ǝ"?: number };

const COLORS: Record<EV, string> = {
  E: "#FF4500", // 公式カラー
  V: "#1E3A8A",
  "Λ": "#84CC16",
  "Ǝ": "#B833F5",
};

function clamp01(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function toRadarData(vec: EVAEVector, order: EV[] = ["E", "V", "Λ", "Ǝ"]) {
  return order.map((k) => ({
    key: k,
    label: k,
    value: clamp01(vec[k]),
    fill: COLORS[k],
  }));
}

export function RadarEVAE({
  vector,
  order = ["E", "V", "Λ", "Ǝ"],
  max = 1,
  strokeOpacity = 0.9,
  fillOpacity = 0.18,
  size = 280,
}: {
  vector: EVAEVector;
  order?: EV[];
  max?: number;
  strokeOpacity?: number;
  fillOpacity?: number;
  size?: number;
}) {
  const data = toRadarData(vector, order);
  // 最大スコアの色で強調線（見栄え用）
  const top = [...data].sort((a, b) => b.value - a.value)[0]?.fill ?? "#999";

  return (
    <div className="w-full" style={{ maxWidth: size }}>
      <ResponsiveContainer width="100%" height={size}>
        <RcRadarChart data={data} outerRadius="78%">
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "white", fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, max]}
            tick={{ fill: "white", fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip
            formatter={(v: number, _name, p) => [`${(v * 100).toFixed(0)}%`, p.payload.key]}
            contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid #222", borderRadius: 8 }}
            labelStyle={{ color: "#fff" }}
          />
          <Radar
            name="EVΛƎ"
            dataKey="value"
            stroke={top}
            fill={top}
            strokeOpacity={strokeOpacity}
            fillOpacity={fillOpacity}
          />
        </RcRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 参考：時系列スパークライン（任意、あとで使う用） */
export type SeriesPoint = { date: string; E?: number; V?: number; "Λ"?: number; "Ǝ"?: number };
// 必要になったら実装を追加（今はRadar優先）
