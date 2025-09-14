"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlowButton from "@/components/GlowButton";

type Pending = {
  name: string;
  birthday: string;
  birthTime: string | null;
  birthPlace: string | null;
  sex: "Male" | "Female" | "Other" | "" ;
  preference: "Female" | "Male" | "Both" | "None" | "Other" | "" | null;
};

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ client側でのみ sessionStorage を読む（キーは profile_pending）
  useEffect(() => {
    const read = () => {
      try {
        const raw = sessionStorage.getItem("profile_pending");
        if (!raw) return null;
        return JSON.parse(raw) as Pending;
      } catch {
        return null;
      }
    };

    const p = read();
    if (p) {
      setPending(p);
      return;
    }
    // レース対策でワンショット再確認
    const t = setTimeout(() => {
      const again = read();
      if (again) setPending(again);
      else router.replace("/profile");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  async function onDiagnose() {
    if (!pending || sending) return;
    setSending(true);
    setErr(null);
    try {
      // 必要十分：サーバー側は不要フィールドがあっても無視する設計推奨
      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "failed");

      // ✅ 結果は profile_result に保存（結果ページも合わせる）
      sessionStorage.setItem("profile_result", JSON.stringify(json.result));
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
        <li>ニックネーム：{pending.name}</li>
        <li>誕生日：{pending.birthday}</li>
        {pending.birthTime && <li>出生時間：{pending.birthTime}</li>}
        {pending.birthPlace && <li>出生地：{pending.birthPlace}</li>}
        {pending.sex && <li>性別：{pending.sex}</li>}
        {pending.preference && <li>恋愛対象：{pending.preference}</li>}
      </ul>

      {err && <p className="mb-4 text-sm text-rose-400">{err}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-md border border-white/20 py-2"
        >
          修正する
        </button>
        <GlowButton
          onClick={onDiagnose}
          disabled={sending}
          className="flex-1 h-11"
          variant="primary"
          size="sm"
        >
          {sending ? "診断中…" : "この内容で診断"}
        </GlowButton>
      </div>
    </main>
  );
}
