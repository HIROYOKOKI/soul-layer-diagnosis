"use client"
import React from "react"
import { RadarChart, TimeSeriesChart, type EVAEVector, type SeriesPoint } from "@/components/charts/Charts"

export function EVAEPolarChart({ values }: { values: EVAEVector }) {
  return <RadarChart values={values} size={260} />
}

export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

// 必要なら中身を後で作り込む
export function EVAEChartSquares() {
  return <div className="text-white/80 text-sm">Squares (coming soon)</div>
}

export function EVAEColorBadges() {
  return <div className="text-white/80 text-sm">Badges (coming soon)</div>
}
