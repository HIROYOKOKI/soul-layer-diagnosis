"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function detectSlot(): GenResp["slot"] {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning"; // 朝=4択
  if (h >= 12 && h < 18) return "noon";   // 昼=3択
  return "night";                          // 夜=2択
}

export default function QuestionClient() {
  const router = useRouter();
  const [resp, setResp] = useState<GenResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<EV | null>(null);

  // 初回に設問を生成
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const slot = detectSlot();
        const env: "dev" | "prod" = "prod";
        const theme = "self";
        const r = await fetch("/api/daily/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, theme, env }),
        });
        const j = (await r.json()) as GenResp;
        if (!j.ok) throw new Error(j.error || "generate_failed");
        setResp(j);
        // confirm/result 用に保存
        sessionStorage.setItem("daily:pending", JSON.stringify(j));
      } catch (e: any) {
        setErr(e?.message || "generate_failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const whenHint = useMemo(() => {
    if (!resp) return "";
    return resp.slot === "morning" ? "（朝 / 4択）"
         : resp.slot === "noon" ? "（昼 / 3択）"
         : "（夜 / 2択）";
  }, [resp?.slot]);

  const onSubmit = () => {
    if (!resp || !picked) return;
    // 確認ページで初期選択させるための一時保存
    sessionStorage.setItem("daily:pre_choice", picked);
    router.push("/daily/confirm");
  };

  return (
    <div className="space-y-6">
      {/* 状態 */}
      {err && <div className="text-red-600 text-sm">エラー：{err}</div>}
      {loading && <div className="rounded-xl border p-4">設問を用意中…</div>}

      {/* 設問 */}
      {resp && (
        <>
          <LuneaBubble key={resp.id} text={`${resp.text} ${whenHint}`} speed={16} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {resp.options?.map((o) => {
              const active = picked === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setPicked(o.key)}
                  className={`w-full rounded-2xl px-5 py-4 border transition
                    ${active ? "border-indigo-500 ring-2 ring-indigo-200"
                             : "border-white/10 hover:bg-white/5"}`}
                >
                  <span className="font-mono mr-2">{o.key}</span>
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!picked}
              className="mt-2 rounded-xl px-5 py-2.5 border shadow-sm disabled:opacity-50"
            >
              回答を送信（確認へ）
            </button>
          </div>
        </>
      )}
    </div>
  );
}
