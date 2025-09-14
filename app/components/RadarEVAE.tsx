"use client";

import { useMemo } from "react";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Props = {
  // 0〜1 の値（ダミーOK）
  values?: Record<EV, number>;
  // 見出し
  title?: string;
};

export default function RadarEVAE({
  values = { E: 0.75, V: 0.35, Λ: 0.2, Ǝ: 0.9 }, // ← ここを変えればダミー調整
  title = "構造バランス（ダミー）",
}: Props) {
  // 4軸の並び（時計回り）：E(上) → V(右) → Λ(下) → Ǝ(左)
  const axes: EV[] = ["E", "V", "Λ", "Ǝ"];
  const size = 360; // 描画サイズ
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.36; // 最大半径
  const rings = 4; // 同心円の数

  // 軸角度（ラジアン）
  const angle = (i: number) => (Math.PI / 2) - (i * (2 * Math.PI / axes.length)); // 上向き基準

  // 値→座標
  const pt = (k: EV, i: number) => {
    const a = angle(i);
    const r = rMax * Math.max(0, Math.min(1, values[k]));
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  const polygon = useMemo(() => {
    const points = axes.map((k, i) => pt(k, i));
    return points.map(p => `${p.x},${p.y}`).join(" ");
  }, [values]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-5 text-white shadow-lg">
      <div className="mb-4 text-lg font-semibold tracking-wide">{title}</div>

      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* 背景 */}
          <defs>
            <radialGradient id="radarBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0b0b0b" />
              <stop offset="100%" stopColor="#101010" />
            </radialGradient>
            <linearGradient id="polyStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="polyFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={size} height={size} fill="url(#radarBg)" rx="24" />

          {/* 同心円 */}
          {[...Array(rings)].map((_, i) => {
            const r = rMax * ((i + 1) / rings);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                fill="none"
              />
            );
          })}

          {/* 十字ガイド */}
          <line x1={cx - rMax} y1={cy} x2={cx + rMax} y2={cy} stroke="rgba(255,255,255,0.08)" />
          <line x1={cx} y1={cy - rMax} x2={cx} y2={cy + rMax} stroke="rgba(255,255,255,0.08)" />

          {/* 軸ラベル */}
          {axes.map((k, i) => {
            const a = angle(i);
            const lx = cx + (rMax + 14) * Math.cos(a);
            const ly = cy - (rMax + 14) * Math.sin(a);
            const color: Record<EV, string> = { E: "#fb7185", V: "#60a5fa", Λ: "#a3e635", Ǝ: "#c084fc" };
            return (
              <text key={k} x={lx} y={ly} fill={color[k]} fontSize="12" textAnchor="middle" dominantBaseline="middle">
                {k}
              </text>
            );
          })}

          {/* 多角形（値） */}
          <polygon
            points={polygon}
            fill="url(#polyFill)"
            stroke="url(#polyStroke)"
            strokeWidth={2}
          />

          {/* 頂点のドット */}
          {axes.map((k, i) => {
            const { x, y } = pt(k, i);
            return <circle key={k} cx={x} cy={y} r={3.2} fill="#ffffff" fillOpacity="0.9" />;
          })}
        </svg>
      </div>

      {/* 凡例（任意） */}
      <div className="mx-auto mt-3 grid max-w-[420px] grid-cols-4 text-center text-xs text-white/70">
        <div>E: {Math.round(values.E * 100)}</div>
        <div>V: {Math.round(values.V * 100)}</div>
        <div>Λ: {Math.round(values.Λ * 100)}</div>
        <div>Ǝ: {Math.round(values.Ǝ * 100)}</div>
      </div>
    </div>
  );
}
