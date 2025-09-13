"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Option = { key: EV; label: string };

type Pending = {
  ok: boolean;
  id: string;
  slot: "morning" | "noon" | "night";
  env: "dev" | "prod";
  text: string;
  options: Option[];
  ts: string;
  theme?: string;
};

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [choice, setChoice] = useState<EV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // sessionStorage からロード（クライアントのみ）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("daily:pending");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Pending;
      if (parsed?.ok && parsed?.id) setPending(parsed);
    } catch {
      /* no-op */
    }
  }, []);

  // ★ ガード：pending を読む前に必ず null チェック
  if (!pending) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-red-600 text-sm mb-3">
          直前の質問データが見つかりませんでした。
        </p>
        <a className="text-indigo-600 underline" href="/daily/generator">
          生成ページへ戻る
        </a>
      </div>
    );
  }

  // ガード後なので安全に参照できる
  const whenText =
    pending.slot === "morning"
      ? "（朝 / 4択）"
      : pending.slot === "noon"
      ? "（昼 / 3択）"
      : "（夜 / 2択）";

  const handleConfirm = async () => {
    setError(null);
    if (!choice) {
      setError("1つ選択してください。");
      return;
    }
    setSubmitting(true);
    try {
      const answer = {
        id: pending.id,
        slot: pending.slot,
        env: pending.env,
        theme: pending.theme ?? "self",
        choice,
        ts: new Date().toISOString(),
      };
      sessionStorage.setItem("daily:answer", JSON.stringify(answer));
      router.push("/daily/result");
    } catch (e: any) {
      setError(e?.message || "confirm_failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">
        id: {pending.id} / slot: {pending.slot} / env: {pending.env} / ts:{" "}
        {new Date(pending.ts).toLocaleString()}
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-base font-medium">
          {pending.text} <span className="text-gray-400 text-sm">{whenText}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {pending.options?.map((opt) => {
          const id = `opt-${opt.key}`;
          const selected = choice === opt.key;
          return (
            <label
              key={opt.key}
              htmlFor={id}
              className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition ${
                selected ? "border-indigo-500 ring-2 ring-indigo-200" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  id={id}
                  type="radio"
                  name="ev_choice"
                  value={opt.key}
                  checked={selected}
                  onChange={() => setChoice(opt.key)}
                  className="h-4 w-4"
                />
                <span className="font-mono text-sm">{opt.key}</span>
                <span className="text-base">{opt.label}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border">EVΛƎ</span>
            </label>
          );
        })}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <a
          href="/daily/generator"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          戻る
        </a>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 border shadow-sm hover:shadow transition"
        >
          {submitting ? "送信中..." : "この内容で回答"}
        </button>
      </div>
    </div>
  );
}
