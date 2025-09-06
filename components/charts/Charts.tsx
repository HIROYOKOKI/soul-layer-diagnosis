"use client"

import React from "react"
// 相対パスで components/charts/Charts.tsx を参照（エイリアス差異回避）
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "./charts/Charts"

/** Radar ラッパー（サイズは端末に合わせて 220/240/260 で調整可） */
export function EVAEPolarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  return <RadarChart values={values} size={size} />
}

/** Line ラッパー（30/90日は横幅が広いので横スクロール付与） */
export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

/** まだ未使用ならプレースホルダのままでOK（後で実装） */
export function EVAEChartSquares() { return <div className="text-white/80 text-sm">Squares (coming soon)</div> }
export function EVAEColorBadges() { return <div className="text-white/80 text-sm">Badges (coming soon)</div> }

// 型 re-export（呼び出し側で型をここから取れるように）
export type { EVAEVector, SeriesPoint } from "./charts/Charts"
