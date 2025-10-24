// app/mypage/RadarMini.tsx
'use client';

type Scores = { E: number; V: number; L: number; Ze: number };

const PALETTE = {
  E:  '#FF4500', // 衝動
  V:  '#1E3A8A', // 可能性
  L:  '#84CC16', // 選択（Λ）
  Ze: '#B833F5', // 観測（Ǝ）
} as const;

function clamp100(n: number) { return Math.max(0, Math.min(100, n)); }
function rad(deg: number) { return (deg * Math.PI) / 180; }
function hex2rgba(hex: string, a: number) {
  const m = hex.replace('#','');
  const r = parseInt(m.slice(0,2),16), g = parseInt(m.slice(2,4),16), b = parseInt(m.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function RadarMini({
  scores,
  max = 100,
  size = 320,
  /** 一番高いスコアのキーを自動で色付け（falseなら常に白） */
  autoHighlight = true,
}: {
  scores: Scores;
  max?: number;
  size?: number;
  autoHighlight?: boolean;
}) {
  // 正規化
  const E = clamp100(scores.E);
  const V = clamp100(scores.V);
  const L = clamp100(scores.L);
  const Ze = clamp100(scores.Ze);

  // ハイライト対象
  const maxKey = ((): keyof Scores => {
    const entries: [keyof Scores, number][] = [['E',E],['V',V],['L',L],['Ze',Ze]];
    entries.sort((a,b) => b[1]-a[1]);
    return entries[0][0];
  })();

  const cx = size / 2;
  const cy = size / 2;
  const r  = (size / 2) - 20;

  // 角度配置（上=E, 右=V, 下=Λ, 左=Ǝ）
  const ang = { E: -90, V: 0, L: 90, Ze: 180 } as const;

  const p = (val: number, deg: number) => {
    const rr = (Math.max(0, Math.min(max, val)) / max) * r;
    return [cx + rr * Math.cos(rad(deg)), cy + rr * Math.sin(rad(deg))] as const;
  };

  const ring = (k: number) => {
    const rr = (k / 4) * r;
    const pts = [
      [cx + rr * Math.cos(rad(ang.V)),  cy + rr * Math.sin(rad(ang.V))],
      [cx + rr * Math.cos(rad(ang.L)),  cy + rr * Math.sin(rad(ang.L))],
      [cx + rr * Math.cos(rad(ang.Ze)), cy + rr * Math.sin(rad(ang.Ze))],
      [cx + rr * Math.cos(rad(ang.E)),  cy + rr * Math.sin(rad(ang.E))],
    ];
    return pts.map(([x,y]) => `${x},${y}`).join(' ');
  };

  const areaPts = [ p(V, ang.V), p(L, ang.L), p(Ze, ang.Ze), p(E, ang.E) ]
    .map(([x,y]) => `${x},${y}`).join(' ');

  // 面とラベルの色
  const c = autoHighlight ? PALETTE[maxKey] : 'rgba(255,255,255,.9)';
  const fillColor = autoHighlight ? hex2rgba(c, .12) : 'rgba(255,255,255,.08)';
  const strokeColor = autoHighlight ? c : 'rgba(255,255,255,.9)';

  // ラベル色関数
  const labelFill = (k: keyof Scores) =>
    autoHighlight && k === maxKey ? PALETTE[k] : 'rgba(255,255,255,.8)';

  // 頂点の小丸
  const dot = ([x,y]: readonly [number, number], k: keyof Scores) => (
    <circle key={`dot-${k}`} cx={x} cy={y} r="3.5"
      fill={autoHighlight && k===maxKey ? PALETTE[k] : 'rgba(255,255,255,.6)'} />
  );

  const pE = p(E, ang.E), pV = p(V, ang.V), pL = p(L, ang.L), pZe = p(Ze, ang.Ze);

  return (
    <svg width="100%" height={size}  viewBox={`${-50} ${-30} ${size + 100} ${size + 60}`} role="img" aria-label="EVAE Radar">
      {/* グリッド（4リング） */}
      {[1,2,3,4].map(k => (
        <polygon key={k} points={ring(k)} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1" />
      ))}

      {/* 軸線 */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy}     stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx} y2={cy + r}     stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={cx - r} y2={cy}     stroke="rgba(255,255,255,.25)" strokeWidth="1" />

      {/* ラベル */}
      <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="12" fill={labelFill('E')}>E（衝動）</text>
      <text x={cx + r + 10} y={cy + 4} textAnchor="start"  fontSize="12" fill={labelFill('V')}>V（可能性）</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="12" fill={labelFill('L')}>Λ（選択）</text>
      <text x={cx - r - 10} y={cy + 4} textAnchor="end"    fontSize="12" fill={labelFill('Ze')}>Ǝ（観測）</text>

      {/* 面 */}
      <polygon points={areaPts} fill={fillColor} stroke={strokeColor} strokeWidth="0.5" />

      {/* 頂点ドット */}
      {dot(pE,'E')}{dot(pV,'V')}{dot(pL,'L')}{dot(pZe,'Ze')}
    </svg>
  );
}
