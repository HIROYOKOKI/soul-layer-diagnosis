"use client"

import React from "react"
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "./charts/Charts"  // ★ 相対参照にする"use client"

import React from "react"
// ★ aliasが不安なら相対参照: "./charts/Charts"
import { RadarChart, TimeSeriesChart, type EVAEVector, type SeriesPoint } from "@/components/charts/Charts"

// EVAEの型(E/V/L/Eexists) → Chartsの型(E/V/L/Eexists/Λ?)にそのまま渡せる
type EVVals = { E: number; V: number; L: number; Eexists: number }

// 1) EVAEPolarChart → Charts.RadarChart のラッパー（関数名はそのまま維持）
export function EVAEPolarChart({
  values,
  size = 260,
}: {
  values: EVVals
  size?: number
}) {
  // Charts の型に合わせてそのまま渡す（Λは不要）
  const mapped: EVAEVector = { E: values.E, V: values.V, L: values.L, Eexists: values.Eexists }
  return <RadarChart values={mapped} size={size} />
}

// 2) EVAETrendChart → Charts.TimeSeriesChart のラッパー（横スクロール込み）
export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

// （任意）他のEVAE UIはプレースホルダのまま
export function EVAEChartSquares() { return <div className="text-white/80 text-sm">Squares (coming soon)</div> }
export function EVAEColorBadges() { return <div className="text-white/80 text-sm">Badges (coming soon)</div> }

// 型を再エクスポート（呼び出し側が型だけここから取れるように）
export type { EVAEVector, SeriesPoint } from "@/components/charts/Charts"


/** Radar ラッパー */
export function EVAEPolarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  return <RadarChart values={values} size={size} />
}

/** Line ラッパー（30/90日は横幅が広い→横スクロール付与） */
export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

/** プレースホルダ（後で実装） */
export function EVAEChartSquares() { return <div className="text-white/80 text-sm">Squares (coming soon)</div> }
export function EVAEColorBadges() { return <div className="text-white/80 text-sm">Badges (coming soon)</div> }

/** 型 re-export（呼び出し側が型だけここから取れるように） */
export type { EVAEVector, SeriesPoint } from "./charts/Charts"
