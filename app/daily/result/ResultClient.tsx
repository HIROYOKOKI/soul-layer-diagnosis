// app/daily/result/ResultClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type Item = {
  question_id?: string;
  mode?: Slot;                          // = slot
  scope?: Scope;                        // ★ 追加
  code: EV;
  comment: string;
  advice?: string | null;
  quote?: string | null;
  created_at?: string;
  env?: "dev" | "prod";
};

export default function ResultClient() {
  const [item, setItem] = useState<Item | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // 最新のデイリー結果を取得
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/mypage/daily-latest?env=dev", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && j.item) {
        setItem(j.item as Item);
        setStep(1);
      }
    })();
  }, []);

  const hasAdvice = !!(item?.advice && item.advice.trim().length);
  const hasAffirm = !!(item?.quote && item.quote.trim().length);
  const nextAfterComment = useMemo(() => (hasAdvice ? 2 : 3), [hasAdvice]);

  const handleCommentDone = useCallback(() => {
    setTimeout(() => setStep(nextAfterComment), 280);
  }, [nextAfterComment]);

  const handleAdviceDone = useCallback(() => {
    setTimeout(() => setStep(3), 260);
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => {
      if (s < 1) return 1;
      if (s === 1) return hasAdvice ? 2 : 3;
      if (s === 2) return 3;
      return 3;
    });
  }, [hasAdvice]);

  async function onSave() {
    if (!item || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const slot: Slot = item.mode || "night";
      const scope: Scope = (item.scope as Scope) || "LIFE";

      // question_id が無い場合のフォールバック（scope まで含めて生成）
      const fallbackId =
        `daily-${new Date().toISOString().slice(0, 10)}-${slot}-${scope}`;

      const payload = {
        id: item.question_id || fallbackId,
        slot,
        scope,                                  // ★ 保存に含める
        env: item.env || "dev",
        theme: "dev",
        choice: item.code,
        result: {
          code: item.code,
          comment: item.comment,
          advice: item.advice ?? undefined,
          quote: item.quote ?? undefined,
        },
      };

      const r = await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "save_failed");

      setSaved(true);
      setSaveMsg("保存しました。");
    } catch (e: any) {
      setSaveMsg("保存に失敗しました：" + (e?.message || "unknown"));
    } finally {
      setSaving(false);
    }
  }

  if (!item) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-black text-white px-5 sm:px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* 日付＆テーマ表示 */}
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>
            {item.created_at &&
              new Date(item.created_at).toLocaleString("ja-JP")}
          </span>
          <span>
            テーマ: {item.scope ?? "—"} / スロット: {item.mode ?? "—"}
          </span>
        </div>

        {/* コメント（ゆっくり表示） */}
        {step >= 1 && (
          <LuneaBubble
            text={`《コメント》\n${item.comment}`}
            tone="accent"
            onDone={handleCommentDone}
            speed={110}
          />
        )}

        {/* アドバイス（ゆっくり表示） */}
        {step >= 2 && hasAdvice && (
          <div className="translate-y-1 opacity-95">
            <LuneaBubble
              text={`《アドバイス》\n${item.advice}`}
              onDone={handleAdviceDone}
              speed={110}
            />
          </div>
        )}

        {/* アファメーション（短文なので少し速め） */}
        {step >= 3 && hasAffirm && (
          <div className="translate-y-1 opacity-90">
            <LuneaBubble text={`《アファメーション》\n${item.quote}`} speed={80} />
          </div>
        )}

        {/* 操作 */}
        <div className="pt-4 flex flex-wrap gap-3">
          {step < 3 && (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#0033ff] text-white hover:opacity-90 transition"
            >
              次へ
            </button>
          )}

          <button
            onClick={onSave}
            disabled={saving || saved}
            className={[
              "px-4 py-2 rounded-xl border transition",
              saved
                ? "border-green-500/50 text-green-300 cursor-default"
                : "border-white/20 hover:bg-white/5",
            ].join(" ")}
          >
            {saved ? "保存済み" : saving ? "保存中…" : "保存する"}
          </button>

          <a
            href="/mypage"
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
          >
            マイページへ
          </a>
        </div>

        {saveMsg && <div className="text-sm opacity-80">{saveMsg}</div>}
      </div>
    </div>
  );
}
