"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type Env = "dev" | "prod";

type Item = {
  question_id?: string;
  mode?: Slot;                 // = slot
  scope?: Scope;               // ← テーマ
  code: EV;
  comment: string;
  advice?: string | null;
  affirm?: string | null;      // ✅ アファメーション専用を追加
  quote?: string | null;       // 名言
  created_at?: string;
  env?: Env;
};

// ===== JSTスロット判定（朝=4-10, 昼=11-16, 夜=その他） =====
function getJstSlot(): Slot {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = jst.getUTCHours();
  if (h >= 4 && h <= 10) return "morning";
  if (h >= 11 && h <= 16) return "noon";
  return "night";
}

export default function ResultClient() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [currentScope, setCurrentScope] = useState<Scope | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // === 初期ロード ===
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const themeRes = await fetch("/api/theme", { cache: "no-store" });
        const themeJson = await themeRes.json().catch(() => null);
        const scope: Scope | null = themeJson?.ok ? (themeJson.scope as Scope) : null;
        setCurrentScope(scope);

        const qs = scope ? `?env=dev&scope=${scope}` : `?env=dev`;
        const r = await fetch(`/api/mypage/daily-latest${qs}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`/api/mypage/daily-latest failed (${r.status})`);
        const j = await r.json();

        if (j?.ok && j.item) {
          setItem(j.item as Item);
          setStep(1);
        } else {
          setItem(null);
        }
      } catch (e: any) {
        setErr(e?.message || "result_fetch_failed");
      }
    })();
  }, []);

  const hasAdvice = !!(item?.advice && item.advice.trim().length);
  const hasAffirm = !!(item?.affirm && item.affirm.trim().length); // ✅ affirmをチェック
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

  // ===== 保存処理 =====
  async function onSave() {
    if (!item || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        alert("ログインが必要です。");
        router.push("/login?next=/daily/result");
        return;
      }

      const slot: Slot = item.mode || getJstSlot();
      const scope: Scope = (item.scope as Scope) || currentScope || "LIFE";
      const theme = scope.toLowerCase();
      const env: Env = item.env || "dev";

      const isoDate = new Date().toISOString().slice(0, 10);
      const question_id = item.question_id || `daily-${isoDate}-${slot}-${scope}`;

      const payload = {
        user_id: user.id,
        slot,
        env,
        question_id,
        scope,
        theme,
        code: item.code,
        score: null as number | null,
        comment: item.comment,
        advice: item.advice ?? null,
        affirm: item.affirm ?? null,   // ✅ affirmを保存
        quote: item.quote ?? null,
        evla: null as Record<string, number> | null,
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

  // ====== UI ======
  if (err) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <div className="text-red-300 text-sm">エラー: {err}</div>
      </div>
    );
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
            {item.created_at && new Date(item.created_at).toLocaleString("ja-JP")}
          </span>
          <span>
            テーマ: {item.scope ?? currentScope ?? "—"} / スロット: {item.mode ?? "—"}
          </span>
        </div>

        {/* コメント */}
        {step >= 1 && (
          <LuneaBubble
            text={`《コメント》\n${item.comment}`}
            tone="accent"
            onDone={handleCommentDone}
            speed={110}
          />
        )}

        {/* アドバイス */}
        {step >= 2 && hasAdvice && (
          <div className="translate-y-1 opacity-95">
            <LuneaBubble
              text={`《アドバイス》\n${item.advice}`}
              onDone={handleAdviceDone}
              speed={110}
            />
          </div>
        )}

        {/* アファメーション */}
        {step >= 3 && hasAffirm && (
          <div className="translate-y-1 opacity-90">
            <LuneaBubble text={`《アファメーション》\n${item.affirm}`} speed={80} />
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
