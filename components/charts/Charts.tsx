"use client"

import React, { useId, useMemo, useState } from "react"

/****************************************************
 * Charts (Radar + Line)
 * - Radar: ラベル E/V/Λ/Ǝ を各色で表示、面は最大スコア色、縁は Ǝ (#B833F5)
 * - Line : 7/30/90 切替向けの描画（※横スクロールは呼び出し側で）
 ****************************************************/

/* ===================== Types & Utils ===================== */
export type EVAEVector = {
  E: number
  V: number
  Eexists: number // Ǝ
  L?: number
  ["Λ"]?: number
}
export type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number }

const PALETTE = { E: "#FF4500", V: "#1E3A8A", L: "#84CC16", Eexists: "#B833F5" } as const
const TICK_COLOR = "rgba(255,255,255,0.10)"

function clamp01(v: unknown) {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
}
function valForLabel(values: EVAEVector, label: "E" | "V" | "Λ" | "Ǝ") {
  if (label === "E") return clamp01(values.E)
  if (label === "V") return clamp01(values.V)
  if (label === "Λ") return clamp01(values["Λ"] ?? values.L)
  return clamp01(values.Eexists) // Ǝ
}
function dominantKey(values: EVAEVector): "E" | "V" | "Λ" | "Ǝ" {
  const entries: Array<["E" | "V" | "Λ" | "Ǝ", number]> = [
    ["E", valForLabel(values, "E")],
    ["V", valForLabel(values, "V")],
    ["Λ", valForLabel(values, "Λ")],
    ["Ǝ", valForLabel(values, "Ǝ")],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

/* ==================== Radar Chart ==================== */
export function RadarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  // ラベルが切れないよう余白を確保
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

  const pts = axes.map(a => polar(a.angle, valForLabel(values, a.label)))
  const points = pts.map(([x, y]) => `${x},${y}`).join(" ")
  const colorFor = (lbl: "E" | "V" | "Λ" | "Ǝ") =>
    lbl === "E" ? PALETTE.E : lbl === "V" ? PALETTE.V : lbl === "Λ" ? PALETTE.L : PALETTE.Eexists

  const dom = dominantKey(values)
  const fillColor = colorFor(dom)

  // 余白込みの viewBox（テキストが切れない）
  const vb = `-${margin} -${margin} ${size + margin * 2} ${size + margin * 2}`
  const gid = (useId() || "gid").replace(/[^a-zA-Z0-9_-]/g, "")

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={vb} preserveAspectRatio="xMidYMid meet">
        {/* grid */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <circle key={t} cx={cx} cy={cy} r={r * t} fill="none" stroke="rgba(255,255,255,0.12)" />
        ))}
        {/* axes + labels */}
        {axes.map(a => {
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
        {/* glow */}
        <defs>
          <radialGradient id={`glow-${gid}`} cx="50%" cy="50%">
            <stop offset="0%"  stopColor="rgba(184,51,245,0.40)" />
            <stop offset="100%" stopColor="rgba(184,51,245,0.00)" />
          </radialGradient>
          <filter id={`blur-${gid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
        </defs>
        <polygon points={points} fill={`url(#glow-${gid})`} filter={`url(#blur-${gid})`} />
        {/* 縁は Ǝ の紫を維持 */}
        <polygon points={points} fill={fillColor} opacity={0.25} stroke={PALETTE.Eexists} strokeOpacity={0.5} />
      </svg>
    </div>
  )
}

/* ==================== Line Chart ==================== */
export function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  const step = 28
  const width = data.length * step + 80
  const height = 260
  const pad = { l: 56, r: 46, t: 18, b: 40 }

  const x = (i: number) => pad.l + i * step
  const y = (v: number) => pad.t + (height - pad.t - pad.b) * (1 - clamp01(v))
  const line = (arr: number[]) => arr.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const colors = { E: PALETTE.E, V: PALETTE.V, L: PALETTE.L, Eexists: PALETTE.Eexists }

  const ticksY = [0, 0.25, 0.5, 0.75, 1]
  const vStep = Math.max(1, Math.ceil(data.length / 10))

  return (
    // 👇 baselineによる縦切れを防ぐ
    <svg className="block" width={width} height={height}>
      {/* axes */}
      <line x1={pad.l} y1={y(0)} x2={width - pad.r} y2={y(0)} stroke={TICK_COLOR} />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} stroke={TICK_COLOR} />
      {/* horizontal grid */}
      {ticksY.map(ty => <line key={ty} x1={pad.l} y1={y(ty)} x2={width - pad.r} y2={y(ty)} stroke={TICK_COLOR} />)}
      {/* vertical grid */}
      {Array.from({ length: data.length }, (_, i) =>
        i % vStep === 0 ? <line key={`vg-${i}`} x1={x(i)} y1={pad.t} x2={x(i)} y2={height - pad.b} stroke="rgba(255,255,255,0.06)" /> : null
      )}
      {/* series */}
      <polyline fill="none" stroke={colors.E} strokeWidth={2} points={line(data.map(d => d.E))} />
      <polyline fill="none" stroke={colors.V} strokeWidth={2} points={line(data.map(d => d.V))} />
      <polyline fill="none" stroke={colors.L} strokeWidth={2} points={line(data.map(d => d.L))} />
      <polyline fill="none" stroke={colors.Eexists} strokeWidth={2} points={line(data.map(d => d.Eexists))} />
    </svg>
  )
}

/* ============ Demo (optional) ============ */
function buildSampleSeries(days = 30): SeriesPoint[] {
  let seed = 42
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
  const today = new Date()
  const out: SeriesPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const E = clamp01(0.55 + (rand() - 0.5) * 0.2)
    const V = clamp01(0.60 + (rand() - 0.5) * 0.2)
    const L = clamp01(0.50 + (rand() - 0.5) * 0.2)
    const Eexists = clamp01(0.58 + (rand() - 0.5) * 0.2)
    out.push({ date: d.toISOString().slice(0, 10), E, V, L, Eexists })
  }
  return out
}
export default function ChartsPreview() {
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const series = useMemo(() => buildSampleSeries(range), [range])
  const last = series[series.length - 1]
  const today: EVAEVector = { E: last.E, V: last.V, L: last.L, Eexists: last.Eexists }

  return (
    <div className="min-h-screen p-6 bg-black text-white space-y-6">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="min-w-full snap-center rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-white/80 mb-2">Radar (E / V / Λ / Ǝ)</h2>
          <RadarChart values={today} />
        </section>
        <section className="min-w-full snap-center rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Line ({range}日推移)</h2>
            <div className="flex items-center gap-2 text-sm">
              {[7, 30, 90].map((n) => (
                <button
                  key={n}
                  onClick={() => setRange(n as 7 | 30 | 90)}
                  className={`px-3 py-1 rounded border ${range === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  {n}日
                </button>
              ))}
            </div>
          </div>
          {/* 横スクロールは呼び出し側で付ける想定。デモでは不要のため直描画 */}
          <TimeSeriesChart data={series} />
        </section>
      </div>
    </div>
  )
}
