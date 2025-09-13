// app/daily/generator/GeneratorClient.tsx
"use client";

import { useState } from "react";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Option = { key: EV; label: string };
type GenResp = {
  ok: boolean;
  id: string;
  slot: "morning" | "noon" | "night";
  env: "dev" | "prod";
  text: string;
  options: Option[];
  ts: string;
  theme?: string;
  error?: string;
};

export default function GeneratorClient() {
  const [slot, setSlot] = useState<"morning" | "noon" | "night">("morning");
  const [theme, setTheme] = useState("self");
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<GenResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setErr(null);
    setResp(null);
    try {
      const r = await fetch("/api/daily/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, theme, env }),
      });
      const j = (await r.json()) as GenResp;
      if (!j.ok) setErr(j.error || "unknown_error");
      else {
        setResp(j);
        sessionStorage.setItem("daily:pending", JSON.stringify(j));
      }
    } catch (e: any) {
      setErr(e?.message || "fetch_failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">slot</label>
          <select className="border rounded-lg px-3 py-2" value={slot} onChange={(e)=>setSlot(e.target.value as any)}>
            <option value="morning">morning（4択）</option>
            <option value="noon">noon（3択）</option>
            <option value="night">night（2択）</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">theme</label>
          <select className="border rounded-lg px-3 py-2" value={theme} onChange={(e)=>setTheme(e.target.value)}>
            <option value="self">self</option>
            <option value="work">work</option>
            <option value="love">love</option>
            <option value="future">future</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">env</label>
          <select className="border rounded-lg px-3 py-2" value={env} onChange={(e)=>setEnv(e.target.value as any)}>
            <option value="prod">prod</option>
            <option value="dev">dev</option>
          </select>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="rounded-xl px-5 py-2.5 border shadow-sm">
        {loading ? "生成中..." : "AIで生成"}
      </button>

      {err && <div className="text-red-600 text-sm">エラー：{err}</div>}

      {resp && (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="text-xs text-gray-500">
            id: {resp.id} / slot: {resp.slot} / env: {resp.env}
          </div>
          <p className="text-base">{resp.text}</p>
          <ul className="list-disc ml-5">
            {resp.options?.map(o => (
              <li key={o.key}><span className="font-mono mr-2">{o.key}</span>{o.label}</li>
            ))}
          </ul>
          <div className="text-xs text-gray-400">ts: {new Date(resp.ts).toLocaleString()}</div>
          <div className="pt-2">
            <a href="/daily/confirm" className="text-indigo-600 underline">確認ページへ</a>
          </div>
        </div>
      )}
    </div>
  );
}
