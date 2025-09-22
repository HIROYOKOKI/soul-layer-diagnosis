// app/theme/ThemeClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type ThemeKey = "work" | "love" | "future" | "self";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const THEMES: ThemeKey[] = ["work", "love", "future", "self"];

const LABEL: Record<ThemeKey, string> = {
  work: "仕事",
  love: "恋愛・結婚",
  future: "未来・進路",
  self: "自己理解・性格",
};

const DESC: Record<ThemeKey, string> = {
  work: "今の役割やキャリアの選び方を見直したい人へ",
  love: "価値観の相性や関係の深め方を知りたい人へ",
  future: "これからの進み方・分岐の判断材料が欲しい人へ",
  self: "自分の傾向を言語化し、日常の選択に活かしたい人へ",
};

// 表示テーマ → EV（UI用）
const THEME_TO_EV: Record<ThemeKey, EV> = {
  work: "Λ",
  love: "V",
  future: "E",
  self: "Ǝ",
};

// 表示テーマ → APIに送る scope（大文字）
const THEME_TO_SCOPE: Record<ThemeKey, Scope> = {
  work: "WORK",
  love: "LOVE",
  future: "FUTURE",
  self: "LIFE",
};

export default function ThemeClient() {
  const router = useRouter();

  const [current, setCurrent] = useState<ThemeKey | null>(null); // 取得済みの保存値
  const [selected, setSelected] = useState<ThemeKey | null>(null); // 画面上の選択（未保存）
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 初期：サーバの現在scope優先、無ければ前回選択
  useEffect(() => {
    (async () => {
      try {
        const prev =
          typeof window !== "undefined"
            ? (sessionStorage.getItem("evae_theme_selected") as ThemeKey | null)
            : null;

        const r = await fetch("/api/theme", { cache: "no-store" }).catch(() => null);
        const j = r ? await r.json() : null;
        const scope: Scope | null = j?.ok ? (j.scope as Scope) : null;

        const init: ThemeKey =
          scope === "WORK"
            ? "work"
            : scope === "LOVE"
            ? "love"
            : scope === "FUTURE"
            ? "future"
            : scope === "LIFE"
            ? "self"
            : prev && THEMES.includes(prev)
            ? prev
            : "self";

        setCurrent(init);
        setSelected(init);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = useMemo(() => selected !== null && selected !== current, [selected, current]);

  const handleSelect = (k: ThemeKey) => {
    setSelected(k);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("evae_theme_selected", k);
    }
    // 触感フィードバック（対応端末のみ）
    const nav = (typeof navigator !== "undefined" ? navigator : undefined) as
      | (Navigator & { vibrate?: (p: number | number[]) => boolean })
      | undefined;
    nav?.vibrate?.(10);
  };

  // 保存実行：/api/theme/set → /api/theme/reset → /mypage
  async function doSave() {
    if (!selected) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      // 1) テーマ保存
      const resp = await fetch("/api/theme/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: THEME_TO_SCOPE[selected] }),
      });
      const res = await resp.json();
      if (!res?.ok) throw new Error(res?.error ?? "failed_to_save");

      // 2) 記録初期化（サーバでソフトリセット; 実処理はAPI側に実装）
      const r2 = await fetch("/api/theme/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: THEME_TO_SCOPE[selected] }),
      }).catch(() => null);
      const j2 = await r2?.json().catch(() => null);
      if (!j2?.ok) throw new Error(j2?.error ?? "failed_to_reset");

      setCurrent(selected);
      setToast("テーマを保存しました");
      setTimeout(() => setToast(null), 2500);

      // 3) マイページへ
      router.push("/mypage");
    } catch (e: any) {
      setToast(`保存に失敗しました：${e?.message ?? "unknown"}`);
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-black text-white">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="px-5 pt-4 pb-28">
        <h1 className="text-xl font-semibold tracking-wide">テーマ選択</h1>
        <p className="text-white/60 text-sm mt-1">今のあなたに一番近いテーマを1つ選んでください。</p>

        <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEMES.map((key) => {
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                aria-pressed={active}
                className={[
                  "w-full text-left rounded-2xl p-4",
                  "border transition-transform",
                  "active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "border-white/60 bg-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.12)_inset]"
                    : "border-white/10 bg-white/5 hover:bg-white/8",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-white/10 grid place-items-center">
                    <span className="text-sm">
                      {key === "work" && "Λ"}
                      {key === "love" && "V"}
                      {key === "future" && "E"}
                      {key === "self" && "Ǝ"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium">{LABEL[key]}</h2>
                      {active && <span className="text-xs px-2 py-0.5 rounded-full bg-white/15">選択中</span>}
                    </div>
                    <p className="text-sm text-white/60 mt-1">{DESC[key]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* 下部バー：未保存時のみ「保存」を出す（即保存しない） */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 border-t border-white/10">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelected(current)}
              disabled={saving}
              className="flex-1 h-12 rounded-xl font-medium border border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={saving}
              className="flex-1 h-12 rounded-xl font-medium border border-violet-400/40 bg-violet-500/20 text-white hover:bg-violet-500/30"
            >
              保存
            </button>
          </div>
          {toast && <div className="mt-3 text-sm text-neutral-300">{toast}</div>}
        </div>
      )}

      {/* 確認モーダル：テーマ変更＝記録初期化の警告 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !saving && setConfirmOpen(false)} />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <div className="text-base font-semibold mb-2">テーマ変更の確認</div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              テーマを変更すると、テーマ別の記録・集計は初期化されます。よろしいですか？
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-red-500/40 bg-red-600/20 hover:bg-red-600/30"
                onClick={doSave}
                disabled={saving}
              >
                変更して初期化
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
