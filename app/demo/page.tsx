// app/demo/page.tsx
"use client"
import { EVAEColorBadgesDemo, EVAETrendChart, EVAEPolarChart } from "@/components/EVAECharts"

export default function DemoPage() {
  return (
    <div className="p-6 space-y-8 bg-black text-white">
      <h1 className="text-xl font-bold text-cyan-300">🎨 EVΛƎ UI LAB</h1>
      <EVAEColorBadgesDemo />
      <div className="space-y-2">
        <h2 className="text-sm text-white/70">追加実験: Trend Chart</h2>
        <EVAETrendChart />
      </div>
      <div className="space-y-2">
        <h2 className="text-sm text-white/70">追加実験: Polar Radar</h2>
        <EVAEPolarChart values={{E:0.5,V:0.7,L:0.3,Eexists:0.8}} />
      </div>
    </div>
  )
}
