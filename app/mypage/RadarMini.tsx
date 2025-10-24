'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function RadarMini({
  scores,
  max = 100,
  size = 320,
  autoHighlight = true,
  /** アニメーションを有効にするか */
  animate = true,
  /** 値が変わったときに形と濃さを滑らかに補間する所要時間(ms) */
  duration = 650,
}: {
  scores: Scores;
  max?: number;
  size?: number;
  autoHighlight?: boolean;
  animate?: boolean;
  duration?: number;
}) {
  // 入力正規化
  const target = useMemo(() => ({
    E: clamp100(scores.E),
    V: clamp100(scores.V),
    L: clamp100(scores.L),
    Ze: clamp100(scores.Ze),
  }), [scores]);

  // prefers-reduced-motion 対応
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // アニメ用の現在値（形も濃さもこの state から描く）
  const [cur, setCur] = useState<Scores>(() => target);
  const rafRef = useRef<number | null>(null);

  // 値が変わったらアニメ開始
  useEffect(() => {
    if (!animate || reduced) { setCur(target); return; }

    const start = performance.now();
    const from = { ...cur };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // 慣性っぽい緩急（イーズアウト）
      const ease = 1 - Math.pow(1 - t, 3);

      setCur({
        E: lerp(from.E, target.E, ease),
        V: lerp(from.V, target.V, ease),
        L: lerp(from.L, target.L, ease),
        Ze: lerp(from.Ze, target.Ze, ease),
      });

      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current && cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { rafRef.current && cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.E, target.V, target.L, target.Ze, animate, reduced, duration]);

  // ハイライト対象（常に最新の表示値で判定）
  const maxKey = ((): keyof Scores => {
    const entries: [keyof Scores, number][] = [['E',cur.E],['V',cur.V],['L',cur.L],['Ze',cur.Ze]];
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

  const pE = p(cur.E, ang.E), pV = p(cur.V, ang.V), pL = p(cur.L, ang.L), pZe = p(cur.Ze, ang.Ze);
  const areaPts = [ pV, pL, pZe, pE ].map(([x,y]) => `${x},${y}`).join(' ');

  // 面・線の色
  const mainColor = autoHighlight ? PALETTE[maxKey] : 'rgba(255,255,255,.9)';
  // 平均値に応じて面の濃さを決める（0.06〜0.26 の範囲でフェード）
  const avg = (cur.E + cur.V + cur.L + cur.Ze) / 4;
  const fillAlpha = 0.06 + (avg / 100) * 0.20;
  const fillColor = hex2rgba(mainColor.startsWith('#') ? mainColor : '#FFFFFF', fillAlpha);
  const strokeColor = mainColor;

  // 端が切れないよう余白を拡張
  const view = `${-40} ${-25} ${size + 80} ${size + 50}`;

  // ラベル色
  const labelFill = (k: keyof Scores) =>
    autoHighlight && k === maxKey ? PALETTE[k] : 'rgba(255,255,255,.8)';

  // 頂点ドット
  const dot = ([x,y]: readonly [number, number], k: keyof Scores) => (
    <circle key={`dot-${k}`} cx={x} cy={y} r="3.5"
      fill={autoHighlight && k===maxKey ? PALETTE[k] : 'rgba(255,255,255,.6)'} />
  );

  return (
    <svg width="100%" height={size} viewBox={view} role="img" aria-label="EVAE Radar">
      {/* グリッド（4リング） */}
      {[1,2,3,4].map(k => (
        <polygon key={k} points={ring(k)} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="0.3" />
      ))}

      {/* 軸線 */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="rgba(255,255,255,.22)" strokeWidth="0.3" />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy}     stroke="rgba(255,255,255,.22)" strokeWidth="0.3" />
      <line x1={cx} y1={cy} x2={cx} y2={cy + r}     stroke="rgba(255,255,255,.22)" strokeWidth="0.3" />
      <line x1={cx} y1={cy} x2={cx - r} y2={cy}     stroke="rgba(255,255,255,.22)" strokeWidth="0.3" />

      {/* ラベル */}
      <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="12" fill={labelFill('E')}>E（衝動）</text>
      <text x={cx + r + 10} y={cy + 4} textAnchor="start"  fontSize="12" fill={labelFill('V')}>V（可能性）</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="12" fill={labelFill('L')}>Λ（選択）</text>
      <text x={cx - r - 10} y={cy + 4} textAnchor="end"    fontSize="12" fill={labelFill('Ze')}>Ǝ（観測）</text>

      {/* 面（濃さは平均スコアでフェード、形は cur の補間で追従） */}
      <polygon points={areaPts} fill={fillColor} stroke={strokeColor} strokeWidth="0.8" />

      {/* 頂点ドット */}
      {dot(pE,'E')}{dot(pV,'V')}{dot(pL,'L')}{dot(pZe,'Ze')}
    </svg>
  );
}
