"use client";

import { useState } from "react";

export default function SyncThemeButton({ theme }: { theme: string }) {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ theme }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "sync_failed");
      setMsg("テーマを同期しました。");
      location.reload();
    } catch {
      setMsg("同期に失敗しました");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={onSync}
        disabled={syncing}
        className="rounded-md bg-white text-black px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
      >
        {syncing ? "同期中…" : `Cookieの「${theme}」で同期`}
      </button>
      {msg && <div className="text-xs mt-1 text-white/70">{msg}</div>}
    </div>
  );
}
