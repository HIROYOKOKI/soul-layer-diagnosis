// app/daily/generator/GeneratorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type GenRes = {
  ok: boolean;
  id: string;
  slot: Slot;
  env: "dev" | "prod";
  text: string;
  options: { key: EV; label?: string }[];
  ts: string;
  error?: string;
};

const SLOT_COUNTS: Record<Slot, number> = { morning: 4, noon: 3, night: 2 };

export default function GeneratorClient() {
  const [slot, setSlot] = useState<Slot>("morning");
  const [theme, setTheme] = useState("self");
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<GenRes | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ev-env");
      if (saved === "dev" || saved === "prod") setEnv(saved);
    } catch {}
  }, []);

  const count = SLOT_COUNTS[slot];

  async function generate() {
    try {
      setErr(null);
      setLoading(true);
      setData(null);
      const res = await fetch("/api/daily/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({ slot, theme, env }),
      });
      const json = (await res.json()) as GenRes;
      if (!res.ok || !json.ok) throw new Error(json.error || `status_${res.status}`);
      setData(json);
      try { localStorage.setItem("ev-env", env) } catch {}
    } catch (e: any) {
      setErr(e?.message || "generate_failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
    alert("JSONをコピーしました");
  }

  const pretty = useMemo(() => {
    if (!data) return "";
    const lines = data.options.map((o) => `- ${o.key}：${o.label ?? o.key}`).join("\n");
    return `${data.text}\n${lines}`;
  }, [data]);

  return (
    <div className="mx-auto max-w-md p-6 text-white">
      <h1 className="text-2xl font-bold">DAILY 設問ジェネレーター（AI）</h1>
      <p className="mt-1 text-sm text-white/70">slotに応じて選択肢数（朝4 / 昼3 / 夜2）を自動調整します。</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm w-20 text-white/70">slot</label>
          <div className="flex gap-2">
            {(["morning","noon","night"] as Slot[]).map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`px-3 py-1 rounded border ${slot===s?"bg-white/15 border-white/40":"bg-white/5 border-white/15 hover:bg-white/10"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/50 ml-2">選択肢: {count}件</div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm w-20 text-white/70">theme</label>
          <input
            value={theme}
            onChange={(e)=>setTheme(e.target.value)}
            placeholder="self / work / love / future …"
            className="flex-1 rounded border border-white/20 bg-black/30 px-3 py-1 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm w-20 text-white/70">env</label>
          <div className="flex gap-2">
            {(["prod","dev"] as const).map((e)=>(
              <button
                key={e}
                onClick={()=>setEnv(e)}
                className={`px-3 py-1 rounded border ${env===e?"bg-white/15 border-white/40":"bg-white/5 border-white/15 hover:bg-white/10"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 disabled:opacity-40"
          >
            {loading ? "生成中…" : "AIで生成"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {err && <div className="text-red-300 text-sm mb-3">エラー: {String(err)}</div>}
        {data && (
          <div className="rounded-2xl border border-white/12 bg-white/5 p-4 space-y-3">
            <div className="text-xs text-white/50">id: {data.id} / slot: {data.slot} / env: {data.env}</div>
            <div className="text-base">{data.text}</div>
            <ul className="text-sm list-disc pl-5">
              {data.options.map((o)=>(
                <li key={o.key} className="mt-0.5">
                  <span className="font-semibold">{o.key}</span>：{o.label ?? o.key}
                </li>
              ))}
            </ul>

            <div className="flex gap-2 pt-2">
              <button onClick={copyJson} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm">
                JSONをコピー
              </button>
              <a href="/daily/question" className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm">
                /daily/question を開く
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

