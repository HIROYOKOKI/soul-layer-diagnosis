// app/components/result/ProfileResultClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ここは .bak の型やUIを徐々に移植してOK
type LegacyLine = { type: string; label: string; text: string };

type DiagnoseDetail = {
  fortune?: string;
  personality?: string;
  work?: string;
  partner?: string;
};

type DiagnoseOk = {
  ok: true;
  result: {
    name: string;
    summary?: string;
    luneaLines: LegacyLine[];
    detail?: DiagnoseDetail;
    theme?: "dev" | "prod";
  };
};

export default function ProfileResultClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ▼ 保存→クイック診断へ（/api/profile/save が未実装でも落ちないように try/catch）
  async function handleSaveAndGoQuick() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // 必要なら .bak から参照している診断データの state をここで使う
      // 例: const payload = { ... };
      // const res = await fetch("/api/profile/save", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // const json = await res.json();
      // if (!json?.ok) throw new Error(json?.error || "save_failed");

      // 保存に成功/未実装でも、流れはクイック診断へ
      router.push("/structure/quick");
    } catch (e: any) {
      setError(e?.message ?? "save_failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      {/* ここに .bak の吹き出しUI（LuneaBubble）や luneaLines の段階表示を移植 */}
      {/* 例）
      <LuneaBubble lines={lines} />
      */}

      {error && (
        <p className="text-sm text-red-400">
          エラー: {error}（あとで再試行してください）
        </p>
      )}

      <button
        onClick={handleSaveAndGoQuick}
        disabled={saving}
        className="w-full rounded-xl bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20 transition disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存してクイック診断へ"}
      </button>
    </div>
  );
}
