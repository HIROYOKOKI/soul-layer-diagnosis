"use client";
import { useMemo, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

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

  const hint = useMemo(
    () => (slot === "morning" ? "（朝 / 4択）" : slot === "noon" ? "（昼 / 3択）" : "（夜 / 2択）"),
    [slot]
  );
  const speed = useMemo(() => (slot === "night" ? 22 : slot === "noon" ? 18 : 16), [slot]);

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
        // confirm用に保存（同一タブで /daily/confirm へ）
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
      {/* フォーム */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">slot</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={slot}
            onChange={(e) => setSlot(e.target.value as "morning" | "noon" | "night")}
          >
            <option value="morning">morning（4択）</option>
            <option value="noon">noon（3択）</option>
            <option value="night">night（2択）</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">theme</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="self">self</option>
            <option value="work">work</option>
            <option value="love">love</option>
            <option value="future">future</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">env</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={env}
            onChange={(e) => setEnv(e.target.value as "dev" | "prod")}
          >
            <option value="prod">prod</option>
            <option value="dev">dev</option>
          </select>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="rounded-xl px-5 py-2.5 border shadow-sm">
        {loading ? "生成中..." : "AIで生成"}
      </button>

      {err && <div className="text-red-600 text-sm">エラー：{err}</div>}

      {/* 結果表示 */}
      {resp && (
        <div className="border rounded-xl p-4 space-y-4">
          <div className="text-xs text-gray-500">
            id: {resp.id} / slot: {resp.slot} / env: {resp.env}
          </div>

          {/* ルネア吹き出しで設問表示（タイプライタ演出） */}
          <LuneaBubble key={resp.id} text={`${resp.text} ${hint}`} speed={speed} />

          <ul className="list-none space-y-2">
            {resp.options?.map((o) => (
              <li key={o.key} className="flex items-center gap-3">
                <span className="font-mono text-sm w-6">{o.key}</span>
                <span>{o.label}</span>
              </li>
            ))}
          </ul>

          <div className="text-xs text-gray-400">ts: {new Date(resp.ts).toLocaleString()}</div>

          <div className="pt-2">
            <a href="/daily/confirm" className="text-indigo-600 underline">
              確認ページへ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
