"use client";

import { useMemo } from "react";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Props = {
  values?: Record<EV, number>;
  title?: string;
};

export default function RadarEVAE({
  values = { E: 0.75, V: 0.35, Λ: 0.2, Ǝ: 0.9 },
  title = "構造バランス（ダミー）",
}: Props) {
  const axes: EV[] = ["E", "V", "Λ", "Ǝ"];
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.36;
  const rings = 4;

  const angle = (i: number) => (Math.PI / 2) - (i * (2 * Math.PI / axes.length));

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
          {[...Array(rings)].map((_, i) => {
            const r = rMax * ((i + 1) / rings);
            return (
              <circle key={i} cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.08)" fill="none" />
            );
          })}
          <polygon points={polygon} fill="rgba(124,58,237,0.2)" stroke="#22d3ee" strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
}
