// app/daily/result/ResultClient.tsx
"use client";
import { useEffect, useState } from "react";

type Item = { code: string; comment: string; quote?: string; created_at?: string };

export default function ResultClient() {
  const [item, setItem] = useState<Item | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/mypage/daily-latest?env=dev", { cache: "no-store" });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "failed");
        setItem(j.item);
      } catch (e:any) {
        setErr(e?.message || "unknown error");
      }
    })();
  }, []);

  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!item) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 space-y-3">
      {item.created_at && <div className="text-xs opacity-70">{new Date(item.created_at).toLocaleString()}</div>}
      <div className="text-2xl font-bold">Code: {item.code}</div>
      <p className="leading-7">{item.comment}</p>
      {item.quote && <blockquote className="border-l pl-3 italic opacity-80">{item.quote}</blockquote>}
    </div>
  );
}
