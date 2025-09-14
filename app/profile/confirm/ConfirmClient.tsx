// app/profile/confirm/ConfirmClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Pending = {
  name: string;
  birthday: string;
  blood: string;
  gender: string;
  preference?: string;
  theme?: "dev" | "prod";
};

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("profile:pending");
    if (!raw) {
      router.replace("/profile"); // 入力が無ければ戻す
      return;
    }
    try {
      setPending(JSON.parse(raw));
    } catch {
      router.replace("/profile");
    }
  }, [router]);

  async function onDiagnose() {
    if (!pending || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "failed");

      // 結果を保存して Result ページへ
      sessionStorage.setItem("profile:result", JSON.stringify(json.result));
      router.push("/profile/result");
    } catch (e: any) {
      setErr(e?.message ?? "診断に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  if (!pending) return null;

  return (
    <main className="mx-auto max-w-lg px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold mb-4">この内容でよろしいですか？</h1>
      <ul className="space-y-2 mb-6 text-white/90">
        <li>お名前：{pending.name}</li>
        <li>生年月日：{pending.birthday}</li>
        <li>血液型：{pending.blood}</li>
        <li>性別：{pending.gender}</li>
      </ul>

      {err && <p className="mb-4 text-sm text-rose-400">{err}</p>}

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 rounded-md border border-white/20 py-2">
          修正する
        </button>
        <button onClick={onDiagnose} disabled={sending} className="flex-1 rounded-md bg-white text-black py-2 font-medium disabled:opacity-50">
          {sending ? "診断中…" : "この内容で診断"}
        </button>
      </div>
    </main>
  );
}
