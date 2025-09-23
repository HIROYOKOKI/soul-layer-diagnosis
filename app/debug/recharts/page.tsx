"use client";

import dynamic from "next/dynamic";

// RadarEVAE を SSR 無効で読み込む
const RadarEVAE = dynamic(
  () => import("@/components/charts/RadarEVAE").then((m) => m.default),
  { ssr: false, loading: () => <div className="p-4 text-white/60">チャート読込中…</div> }
);

export default function RechartsDebugPage() {
  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Recharts Debug</h1>

      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 max-w-sm">
        <RadarEVAE
          vector={{ E: 0.8, V: 0.6, "Λ": 0.4, "Ǝ": 0.7 }}
          order={["E", "V", "Λ", "Ǝ"]}
          size={300}
        />
      </div>
    </div>
  );
}

