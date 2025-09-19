"use client";
import { useState } from "react";

type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
const SCOPES: Scope[] = ["WORK", "LOVE", "FUTURE", "LIFE"];

export default function ThemeClient() {
  const [selected, setSelected] = useState<Scope>("LIFE");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSave() {
    setSaving(true);
    setErr(null);
    setOk(false);
    try {
      // 念のため大文字・バリデーション
      const scope = (selected || "LIFE").toUpperCase() as Scope;
      if (!SCOPES.includes(scope)) throw new Error("invalid_scope_client");

      const r = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, reset: true }), // ★ 重要: scope を送る
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `save_failed_${r.status}`);
      }

      setOk(true);
      // 反映確認のため即 /mypage へ戻すなら↓
      // location.href = "/mypage";
    } catch (e: any) {
      setErr(e?.message || "save_failed");
      alert("保存に失敗しました"); // 既存のアラートに合わせる
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5">
      {/* テーマ選択UI（例） */}
      <div className="space-y-2">
        {SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={`w-full rounded-xl px-4 py-3 text-left border ${
              selected === s ? "border-white/40 bg-white/10" : "border-white/15 bg-white/5"
            }`}
          >
            {s === "WORK" && "仕事"}{s === "LOVE" && "恋愛・結婚"}
            {s === "FUTURE" && "未来・進路"}{s === "LIFE" && "自己理解・性格"}
            <span className="ml-2 text-xs opacity-60">({s})</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-white text-black px-4 py-2 disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
        {ok && <span className="text-green-300 text-sm">保存しました</span>}
        {err && <span className="text-red-300 text-sm">エラー: {err}</span>}
      </div>
    </div>
  );
}
