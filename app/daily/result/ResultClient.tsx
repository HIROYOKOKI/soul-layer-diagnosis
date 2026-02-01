// app/daily/result/ResultClient.tsx
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
  id?: string | null;              // ← question_idに相当する場合もあるので保険で追加
  question_id?: string | null;
  mode?: Slot | null;              // ← UIではslot扱いで使用（normalizeでslot→modeに寄せる）
  scope?: Scope | null;
  code: EV;
  comment: string;
  advice?: string | null;
  affirm?: string | null;
  quote?: string | null;
  created_at?: string | null;
  env?: Env | null;
  __source?: "gpt" | "fallback";
};

/** JSTの現在時刻のhourを取得（DST等にも強いIntlベース） */
function getJstHour(): number {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(hourStr, 10);
}

/** JSTのhourからmorning/noon/nightを決定（閾値は必要に応じて調整） */
function slotByHourJST(h: number): Slot {
  if (h >= 5 && h < 11) return "morning"; // 05:00-10:59
  if (h >= 11 && h < 17) return "noon";   // 11:00-16:59
  return "night";                         // 17:00-04:59
}

/** 現在のJSTスロット */
function getJstSlot(): Slot {
  return slotByHourJST(getJstHour());
}

/** question_id / id からスロットを推定（例: daily-YYYY-MM-DD-morning[-SCOPE]） */
function deriveSlotFromId(maybeId?: string | null): Slot | null {
  if (!maybeId) return null;
  const m = String(maybeId).match(
    /daily-\d{4}-\d{2}-\d{2}-(morning|noon|night)(?:-|$)/i
  );
  return (m?.[1]?.toLowerCase() as Slot) ?? null;
}

/** サーバ/セッションの素データをUI用に正規化（slot→modeに寄せる） */
function normalize(raw: any | null): Item | null {
  if (!raw) return null;
  const slot = (raw.slot ?? raw.mode ?? null) as Slot | null;
  const scope = (raw.scope ?? null) as Scope | null;
  const affirm = raw.affirm ?? raw.affirmation ?? raw.quote ?? null;

  return {
    id: raw.id ?? raw.question_id ?? null,
    question_id: raw.question_id ?? null,
    mode: slot, // ← 今後はUIでは mode をslotとして扱う
    scope,
    code: (raw.code ?? "E") as EV,
    comment: String(raw.comment ?? ""),
    advice: raw.advice ?? null,
    affirm: affirm,
    quote: raw.quote ?? null,
    created_at: raw.created_at ?? null,
    env: (raw.env ?? null) as Env | null,
    __source: raw.__source ?? undefined,
  };
}

export default function ResultClient() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [currentScope, setCurrentScope] = useState<Scope | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [empty, setEmpty] = useState(false);
  const [unauth, setUnauth] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ▼ 追加：名前を一度だけ取得
  const [meName, setMeName] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/me", {
  cache: "no-store",
  credentials: "include",
});

        const j = await r.json().catch(() => null);
        const name =
          j?.item?.name ||
          j?.item?.display_id ||
          j?.item?.user_no ||
          (j?.item?.email ? String(j.item.email).split("@")[0] : null) ||
          null;
        if (active) setMeName(name);
      } catch {
        if (active) setMeName(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ▼ 表示時だけ先頭に「◯◯さん、」を保証（保存内容は元のまま）
  const ensurePrefix = useCallback(
    (text?: string | null) => {
      if (!text || !text.trim()) return "";
      const name = meName?.trim();
      if (!name) return text;
      const prefix = `${name}さん, `;
      const t = String(text);
      if (t.startsWith(prefix)) return t;
      const trimmedHead = t.replace(/^[\s\u3000]+/, "");
      if (trimmedHead.startsWith(prefix)) return t;
      return `${prefix}${t}`;
    },
    [meName]
  );

  // ── 初期ロード：①sessionStorage → ②最新API → ③テーマ取得
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setErr(null);

        // ① 直前の生成結果（質問ページで保存した値）
        let usedSession = false;
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("last_daily_result");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const n = normalize(parsed);
              if (n && mounted) {
                setItem(n);
                setStep(1);
                usedSession = true;
              }
            } catch {
              // 壊れてたら捨てる
            } finally {
              sessionStorage.removeItem("last_daily_result");
            }
          }
        }

        // ② セッションが無い/使えない場合は API から最新1件
        if (!usedSession) {
          const r = await fetch(`/api/mypage/daily-latest`, { cache: "no-store" });
          if (!r.ok) throw new Error(`/api/mypage/daily-latest failed (${r.status})`);
          const j = await r.json();

          if (j?.unauthenticated) {
            if (!mounted) return;
            setUnauth(true);
            setEmpty(true);
            return;
          }

          if (j?.ok && j.item) {
            const n = normalize(j.item);
            if (mounted) {
              setItem(n);
              setStep(1);
            }
          } else {
            if (mounted) setEmpty(true);
          }
        }

        // ③ テーマ取得（表示用）
        try {
          const themeRes = await fetch("/api/theme", { cache: "no-store" });
          const themeJson = await themeRes.json().catch(() => null);
          const scopeVal = String(themeJson?.scope ?? themeJson?.theme ?? "").toUpperCase();
          if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(scopeVal)) {
            if (mounted) setCurrentScope(scopeVal as Scope);
          }
        } catch {
          /* noop */
        }
      } catch (e: any) {
        if (mounted) setErr(e?.message || "result_fetch_failed");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const hasAdvice = !!(item?.advice && item.advice.trim().length);
  const hasAffirm = !!(item?.affirm && item.affirm.trim().length);
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

  // UI表示用の堅牢なスロット決定（mode → question_id/id → JST）
  const displaySlot: Slot = useMemo(() => {
    const fromItem = (item?.mode as Slot | null) ?? null;
    if (fromItem) return fromItem;
    const fromId =
      deriveSlotFromId(item?.question_id ?? item?.id ?? null);
    if (fromId) return fromId;
    return getJstSlot();
  }, [item?.mode, item?.question_id, item?.id]);

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

      // 保存時も堅牢に：item.mode → question_idから推定 → JST
      const slot: Slot =
        (item.mode as Slot | null) ??
        deriveSlotFromId(item.question_id ?? item.id ?? null) ??
        getJstSlot();

      const scope: Scope = (item.scope as Scope) || currentScope || "LIFE";
      const theme = scope.toLowerCase();
      const env: Env = (item.env as Env) || "dev";

      const isoDate = new Date().toISOString().slice(0, 10);
      const question_id =
        item.question_id || `daily-${isoDate}-${slot}-${scope}`;

      const payload = {
        user_id: user.id,
        slot,
        env,
        question_id,
        scope,
        theme,
        code: item.code,
        score: null as number | null,
        comment: item.comment,      // 保存は元の文そのまま
        advice: item.advice ?? null,
        affirm: item.affirm ?? null,
        quote: item.quote ?? null,
        evla: null as Record<string, number> | null,
      };

      const r = await fetch("/api/daily/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",      // ← これが決定打
  cache: "no-store",
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

  // ===== UI =====
  if (err) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <div className="text-red-300 text-sm">エラー: {err}</div>
      </div>
    );
  }

  // 空状態（未ログイン or レコードなし）
  if (empty && !item) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="opacity-80 text-sm">
            {unauth
              ? "ログイン後にデイリー診断を実行してください。"
              : "まだ診断がありません。/daily から診断を実行してください。"}
          </div>
          <div className="flex gap-3 justify-center">
            {unauth ? (
              <a
                href="/login?next=/daily/result"
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
              >
                ログインへ
              </a>
            ) : (
              <a
                href="/daily"
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
              >
                デイリーへ
              </a>
            )}
            <a
              href="/mypage"
              className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
            >
              マイページへ
            </a>
          </div>
        </div>
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

  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("RESULT SOURCE:", item.__source, item);
  }

  // ▼ 表示時だけ prefix を当てたテキストを作る（保存は生データのまま）
  const shownComment = ensurePrefix(item.comment);
  const shownAdvice = item.advice ? ensurePrefix(item.advice) : "";
  const shownAffirm = item.affirm ? ensurePrefix(item.affirm) : "";

  return (
    <div className="min-h-[70vh] bg-black text-white px-5 sm:px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>
            {item.created_at &&
              new Date(item.created_at).toLocaleString("ja-JP")}
          </span>
          <span>
            テーマ: {item.scope ?? currentScope ?? "—"} / スロット: {displaySlot}
          </span>
        </div>

        {step >= 1 && (
          <LuneaBubble
            text={`《コメント》\n${shownComment}`}
            tone="accent"
            onDone={handleCommentDone}
            speed={110}
          />
        )}

        {step >= 2 && !!(item.advice && item.advice.trim()) && (
          <div className="translate-y-1 opacity-95">
            <LuneaBubble
              text={`《アドバイス》\n${shownAdvice}`}
              onDone={handleAdviceDone}
              speed={110}
            />
          </div>
        )}

        {step >= 3 && !!(item.affirm && item.affirm.trim()) && (
          <div className="translate-y-1 opacity-90">
            <LuneaBubble text={`《アファメーション》\n${shownAffirm}`} speed={80} />
          </div>
        )}

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
