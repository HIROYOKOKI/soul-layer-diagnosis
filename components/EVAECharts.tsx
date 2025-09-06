"use client"

import React from "react"
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "@/components/charts/Charts"

/**
 * Radar ラッパー
 * - size は端末に合わせて 220/240/260 で調整可（既定 260）
 */
export function EVAEPolarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  return <RadarChart values={values} size={size} />
}

/**
 * Line ラッパー
 * - 30/90日で横幅が広くなるので、ここで横スクロールを付与
 */
export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

/** まだ使わないのでプレースホルダのままでOK（後で実装） */
export function EVAEChartSquares() {
  return <div className="text-white/80 text-sm">Squares (coming soon)</div>
}
export function EVAEColorBadges() {
  return <div className="text-white/80 text-sm">Badges (coming soon)</div>
}

/** 型だけここから取りたい時のために re-export */
export type { EVAEVector, SeriesPoint } from "@/components/charts/Charts"
