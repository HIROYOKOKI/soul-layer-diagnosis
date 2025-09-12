// app/profile/_hooks/useProfileDiagnose.ts
"use client";

import { useEffect, useState } from "react";

type Result = {
  ok: boolean;
  result?: any;
  error?: string;
};

export function useProfileDiagnose(
  payload: any,
  opts: { enabled?: boolean } = {}
) {
  const { enabled = false } = opts;        // ★ デフォルト無効
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!enabled) return;                   // ★ 明示指定が無ければ絶対に動かない
    (async () => {
      try {
        setLoading(true); setErr(null);
        const res = await fetch("/api/profile/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload ?? {}),
        });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j?.ok) throw new Error(j?.error || "diagnose_failed");
        setData(j);
      } catch (e: any) {
        setErr(e?.message || "diagnose_failed");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [enabled]);                             // ★ payload 変更で連打しない（必要なら依存に追加）

  return { data, loading, error: err };
}
