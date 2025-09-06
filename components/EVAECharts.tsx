"use client"
import React from "react"
import { RadarChart, TimeSeriesChart, type EVAEVector, type SeriesPoint } from "@/components/charts/Charts"

export function EVAEPolarChart({ values, size = 260 }: { values: EVAEVector; size?: number }) {
  return <RadarChart values={values} size={size} />
}

export function EVAETrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TimeSeriesChart data={data} />
    </div>
  )
}

export function EVAEChartSquares() {
  return <div className="text-white/80 text-sm">Squares (coming soon)</div>
}

export function EVAEColorBadges() {
  return <div className="text-white/80 text-sm">Badges (coming soon)</div>
}

export type { EVAEVector, SeriesPoint } from "@/components/charts/Charts"
