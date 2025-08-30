// RadarChart — 4色グラデ版（枠線を白30%／太さ1pxに調整）

type RadarKey = "E" | "V" | "L" | "Eexists";
type RadarValues = { E: number; V: number; L: number; Eexists: number };

function clamp01(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeValues(values?: Partial<RadarValues>): RadarValues {
  return {
    E: clamp01(values?.E ?? 0),
    V: clamp01(values?.V ?? 0),
    L: clamp01(values?.L ?? 0),
    Eexists: clamp01(values?.Eexists ?? 0),
  };
}

function labelFor(key: RadarKey): string {
  if (key === "Eexists") return "Ǝ";
  if (key === "L") return "Λ";
  return key;
}

export function RadarChart({
  values,
  colors = { E: "#ff005d", V: "#00e0ff", L: "#33ff88", Eexists: "#b366ff" },
  idPrefix = "radar",
}: {
  values?: Partial<RadarValues>;
  colors?: { E: string; V: string; L: string; Eexists: string };
  idPrefix?: string;
}) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;

  const norm = normalizeValues(values);

  const axes: Array<{ key: RadarKey; angle: number; value: number }> = [
    { key: "E", angle: -90, value: norm.E },
    { key: "V", angle: 0, value: norm.V },
    { key: "L", angle: 90, value: norm.L },
    { key: "Eexists", angle: 180, value: norm.Eexists },
  ];

  function polar(angleDeg: number, radiusScale: number): [number, number] {
    const rad = (Math.PI / 180) * angleDeg;
    const rr = r * clamp01(radiusScale);
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  }

  const polyPoints = axes
    .map((a) => polar(a.angle, a.value))
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  const ids = {
    clip: `${idPrefix}-clip`,
    gradE: `${idPrefix}-grad-e`,
    gradV: `${idPrefix}-grad-v`,
    gradL: `${idPrefix}-grad-l`,
    gradEe: `${idPrefix}-grad-ee`,
    glow: `${idPrefix}-glow`,
    blur: `${idPrefix}-blur`,
  } as const;

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-[0_0_60px_rgba(56,189,248,0.5)]"
      >
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <circle key={t} cx={cx} cy={cy} r={r * t} className="fill-none stroke-white/30" />
        ))}

        {axes.map((a) => {
          const [x, y] = polar(a.angle, 1);
          return (
            <g key={a.key}>
              <line x1={cx} y1={cy} x2={x} y2={y} className="stroke-white/30" />
              <text
                x={x}
                y={y}
                dy={a.angle === 90 ? 16 : a.angle === -90 ? -10 : 8}
                className="fill-white font-bold text-[16px] tracking-wide"
              >
                {labelFor(a.key)}
              </text>
            </g>
          );
        })}

        <defs>
          <clipPath id={ids.clip}>
            <polygon points={polyPoints} />
          </clipPath>

          <linearGradient id={ids.gradE} x1="50%" y1="50%" x2="50%" y2="0%">
            <stop offset="0%" stopColor={colors.E} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.E} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={ids.gradV} x1="50%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={colors.V} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.V} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={ids.gradL} x1="50%" y1="50%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={colors.L} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.L} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={ids.gradEe} x1="50%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor={colors.Eexists} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.Eexists} stopOpacity="1" />
          </linearGradient>

          <radialGradient id={ids.glow} cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.8)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.0)" />
          </radialGradient>
          <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
          </filter>
        </defs>

        <g clipPath={`url(#${ids.clip})`} style={{ mixBlendMode: "screen" }}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r} fill={`url(#${ids.gradE})`} />
          <rect x={cx} y={cy - r} width={r} height={r * 2} fill={`url(#${ids.gradV})`} />
          <rect x={cx - r} y={cy} width={r * 2} height={r} fill={`url(#${ids.gradL})`} />
          <rect x={cx - r} y={cy - r} width={r} height={r * 2} fill={`url(#${ids.gradEe})`} />
        </g>

        <polygon points={polyPoints} fill={`url(#${ids.glow})`} filter={`url(#${ids.blur})`} />
        <polygon points={polyPoints} className="fill-transparent stroke-white/30" strokeWidth={1} />
      </svg>
    </div>
  );
}

export default function RadarChartDemo() {
  return (
    <div className="p-6 bg-black min-h-[320px] text-white">
      <div className="mb-3 text-sm text-white/70">RadarChart demo (E/V/Λ/Ǝ)</div>
      <RadarChart values={{ E: 0.62, V: 0.78, L: 0.45, Eexists: 0.68 }} />
    </div>
  );
}
