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
  const [theme, setTheme] = useState<string>("self"); // 好きなテーマに合わせて
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
      if (!j.ok) {
        setErr(j.error || "unknown_error");
      } else {
        setResp(j);
        // 次ステップ用：確認ページで拾えるようにセッションに保存
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
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">slot</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={slot}
            onChange={(e) => setSlot(e.target.value as any)}
          >
            <option value="morning">morning（4択）</option>
            <option value="noon">noon（3択）</option>
            <option value="night">night（2択）</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">theme</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="self">self（自己）</option>
            <option value="work">work（仕事）</option>
            <option value="love">love（恋愛）</option>
            <option value="future">future（未来）</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">env</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={env}
            onChange={(e) => setEnv(e.target.value as any)}
          >
            <option value="prod">prod</option>
            <option value="dev">dev</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 border shadow-sm hover:shadow transition"
      >
        {loading ? "生成中..." : "AIで生成"}
      </button>

      {/* 結果表示 */}
      {err && (
        <div className="text-red-600 text-sm">
          エラー：{err}
        </div>
      )}

      {resp && (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="text-xs text-gray-500">
            id: {resp.id} / slot: {resp.slot} / env: {resp.env}
          </div>
          <p className="text-base">{resp.text}</p>
          <ul className="list-disc ml-5">
            {resp.options?.map((o) => (
              <li key={o.key}>
                <span className="font-mono mr-2">{o.key}</span>
                {o.label}
              </li>
            ))}
          </ul>
          <div className="text-xs text-gray-400">
            ts: {new Date(resp.ts).toLocaleString()}
          </div>
          {/* 次ステップ：確認ページへ（今は配置だけ） */}
          <div className="pt-2">
            <a
              href="/daily/confirm"
              className="text-indigo-600 underline hover:no-underline"
            >
              確認ページへ（Step 2 で実装）
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
