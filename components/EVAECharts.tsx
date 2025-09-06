"use client"

import React from "react"
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "@/components/charts/Charts"

/** 
 * EVAEPolarChart
 * - Charts.tsx の RadarChart をラップ
 * - size は必要に応じて 220/240/260 へ変更可（デフォ 260）
 */
export function EVAEPolarChart({
  values,
  size = 260,
}: {
  values: EVAEVector
  size?: number
}) {
  return <RadarChart values={values} size={size} />
}

/**
 * EVAETrendChart
 * - Charts.tsx の TimeSeriesChart を横スクロール付きでラップ
 * - /mypage 側が 30/90日でも右端まで見れる
 */
export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

/**
 * 以降は簡易プレースホルダ
 * 必要になったら本実装に差し替え
 */
export function EVAEChartSquares() {
  return <div className="text-white/80 text-sm">Squares (coming soon)</div>
}

export function EVAEColorBadges() {
  return <div className="text-white/80 text-sm">Badges (coming soon)</div>
}

/* 型を re-export しておくと、呼び出し側が型だけここから輸入できて便利 */
export type { EVAEVector, SeriesPoint } from "@/components/charts/Charts"
