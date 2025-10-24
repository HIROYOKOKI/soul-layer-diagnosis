// app/mypage/RadarMini.tsx
'use client';

type Scores = { E: number; V: number; L: number; Ze: number };
export default function RadarMini({
  scores,
  max = 100,
  size = 280,
}: { scores: Scores; max?: number; size?: number }) {
  const { E, V, L, Ze } = scores;
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size / 2) - 20;

  // 角度配置（上=E, 右=V, 下=Λ, 左=Ǝ）
  const ang = { E: -90, V: 0, L: 90, Ze: 180 };
  const rad = (deg: number) => (deg * Math.PI) / 180;

  const p = (val: number, deg: number) => {
    const rr = (Math.max(0, Math.min(max, val)) / max) * r;
    return [cx + rr * Math.cos(rad(deg)), cy + rr * Math.sin(rad(deg))];
  };

  const ring = (k: number) => {
    const rr = (k / 4) * r;
    const pts: [number, number][] = [
      [cx + rr * Math.cos(rad(ang.V)),  cy + rr * Math.sin(rad(ang.V))],   // 右
      [cx + rr * Math.cos(rad(ang.L)),  cy + rr * Math.sin(rad(ang.L))],   // 下
      [cx + rr * Math.cos(rad(ang.Ze)), cy + rr * Math.sin(rad(ang.Ze))],  // 左
      [cx + rr * Math.cos(rad(ang.E)),  cy + rr * Math.sin(rad(ang.E))],   // 上
    ];
    return pts.map(([x,y]) => `${x},${y}`).join(' ');
  };

  const areaPts = [
    p(V, ang.V), p(L, ang.L), p(Ze, ang.Ze), p(E, ang.E)
  ].map(([x,y]) => `${x},${y}`).join(' ');

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="EVAE Radar">
      {/* グリッド（4リング） */}
      {[1,2,3,4].map(k => (
        <polygon key={k} points={ring(k)} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
      ))}

      {/* 軸線 */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx} y2={cy + r} stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx - r} y2={cy} stroke="rgba(255,255,255,.25)" strokeWidth="1" />

      {/* ラベル */}
      <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,.8)">E（衝動）</text>
      <text x={cx + r + 10} y={cy + 4} textAnchor="start"  fontSize="12" fill="rgba(255,255,255,.8)">V（可能性）</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,.8)">Λ（選択）</text>
      <text x={cx - r - 10} y={cy + 4} textAnchor="end"    fontSize="12" fill="rgba(255,255,255,.8)">Ǝ（観測）</text>

      {/* 面 */}
      <polygon points={areaPts} fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" />
    </svg>
  );
}
