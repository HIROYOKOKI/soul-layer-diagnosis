"use client"

import React, { useId } from "react"

/* ===================== Types & Utils ===================== */
export type EVAEVector = { E: number; V: number; Eexists: number; L?: number; ["Λ"]?: number }
export type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number }

const PALETTE = { E: "#FF4500", V: "#1E3A8A", L: "#84CC16", Eexists: "#b833f5" } as const
const TICK_COLOR = "rgba(255,255,255,0.10)"

function clamp01(v: unknown) {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
}
function valForLabel(values: EVAEVector, label: "E" | "V" | "Λ" | "Ǝ") {
  if (label === "E") return clamp01(values.E)
  if (label === "V") return clamp01(values.V)
  if (label === "Λ") return clamp01(values["Λ"] ?? values.L)
  return clamp01(values.Eexists)
}
function dominantKey(values: EVAEVector): "E" | "V" | "Λ" | "Ǝ" {
  const arr: Array<["E" | "V" | "Λ" | "Ǝ", number]> = [
    ["E", valForLabel(values, "E")],
    ["V", valForLabel(values, "V")],
    ["Λ", valForLabel(values, "Λ")],
    ["Ǝ", valForLabel(values, "Ǝ")],
  ]
  arr.sort((a, b) => b[1] - a[1])
  return arr[0][0]
}

/* ==================== Radar Chart ==================== */
export function RadarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  const margin = 18
  const cx = size / 2
  const cy = size / 2
  const r = Math.max(0, size / 2 - margin)

  const axes = [
    { label: "E" as const, angle: -90 },
    { label: "V" as const, angle: 0 },
    { label: "Λ" as const, angle: 90 },
    { label: "Ǝ" as const, angle: 180 },
  ]
  const polar = (deg: number, s: number) => {
    const rad = (Math.PI / 180) * deg
    const rr = r * clamp01(s)
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)] as const
  }

  const pts = axes.map((a) => polar(a.angle, valForLabel(values, a.label)))
  const points = pts.map(([x, y]) => `${x},${y}`).join(" ")
  const colorFor = (l: "E" | "V" | "Λ" | "Ǝ") =>
    l === "E" ? PALETTE.E : l === "V" ? PALETTE.V : l === "Λ" ? PALETTE.L : PALETTE.Eexists
  const dom = dominantKey(values)
  const fillColor = colorFor(dom)

  const gid = (useId() || "gid").replace(/[^a-zA-Z0-9_-]/g, "")
  const vb = `-${margin} -${margin} ${size + margin * 2} ${size + margin * 2}`

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={vb} preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <circle key={t} cx={cx} cy={cy} r={r * t} fill="none" stroke="rgba(255,255,255,0.12)" />
        ))}
        {axes.map((a) => {
          const [x, y] = polar(a.angle, 1)
          const c = colorFor(a.label)
          return (
            <g key={a.label}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" />
              <text x={x} y={y} dy={a.angle === 90 ? 12 : a.angle === -90 ? -6 : 4} fontSize={13} fontWeight={700} fill={c}>
                {a.label}
              </text>
            </g>
          )
        })}
        <defs>
          <radialGradient id={`glow-${gid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(184,51,245,0.40)" />
            <stop offset="100%" stopColor="rgba(184,51,245,0.00)" />
          </radialGradient>
          <filter id={`blur-${gid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
        </defs>
        <polygon points={points} fill={`url(#glow-${gid})`} filter={`url(#blur-${gid})`} />
        <polygon points={points} fill={fillColor} opacity={0.25} stroke={PALETTE.Eexists} strokeOpacity={0.5} />
      </svg>
    </div>
  )
}

/* ==================== Line Chart ==================== */
export function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  const n = data.length
  const step = n <= 7 ? 28 : n <= 30 ? 16 : 10   // 日数に応じて横幅を調整
  const width = n * step + 80
  const height = 300                              // 視認性UP
  const pad = { l: 56, r: 46, t: 18, b: 40 }

  const x = (i: number) => pad.l + i * step
  const y = (v: number) => pad.t + (height - pad.t - pad.b) * (1 - clamp01(v))
  const line = (arr: number[]) => arr.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const colors = { E: PALETTE.E, V: PALETTE.V, L: PALETTE.L, Eexists: PALETTE.Eexists }

  const ticksY = [0, 0.25, 0.5, 0.75, 1]
  const vStep = Math.max(1, Math.ceil(n / 10))

  return (
    <svg className="block" width={width} height={height}>
      {/* axes */}
      <line x1={pad.l} y1={y(0)} x2={width - pad.r} y2={y(0)} stroke={TICK_COLOR} />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} stroke={TICK_COLOR} />

      {/* horizontal grid */}
      {ticksY.map((ty) => (
        <line key={ty} x1={pad.l} y1={y(ty)} x2={width - pad.r} y2={y(ty)} stroke={TICK_COLOR} />
      ))}

      {/* vertical grid */}
      {Array.from({ length: n }, (_, i) =>
        i % vStep === 0 ? (
          <line key={`vg-${i}`} x1={x(i)} y1={pad.t} x2={x(i)} y2={height - pad.b} stroke="rgba(255,255,255,0.06)" />
        ) : null
      )}

      {/* series */}
      <polyline fill="none" stroke={colors.E} strokeWidth={2} points={line(data.map((d) => d.E))} />
      <polyline fill="none" stroke={colors.V} strokeWidth={2} points={line(data.map((d) => d.V))} />
      <polyline fill="none" stroke={colors.L} strokeWidth={2} points={line(data.map((d) => d.L))} />
      <polyline fill="none" stroke={colors.Eexists} strokeWidth={2} points={line(data.map((d) => d.Eexists))} />
    </svg>
  )
}
