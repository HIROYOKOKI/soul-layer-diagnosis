// app/structure/quick/QuickClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";

const CHOICES: Array<{ code: EV; label: string; desc: string }> = [
  { code: "E", label: "E（衝動・情熱）", desc: "やりたいことを迷わず行動に移す力" },
  { code: "V", label: "V（可能性・夢）", desc: "まだ見ぬ未来や夢を追いかける心" },
  { code: "Λ", label: "Λ（選択・葛藤）", desc: "悩みながらも自分で選び取る自由" },
  { code: "Ǝ", label: "Ǝ（観測・静寂）", desc: "ものごとを見つめ、意味を感じ取る時間" },
];

export default function QuickClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<EV[]>([]);
  const [locking, setLocking] = useState(false);
  const [ready, setReady] = useState(false);
  const [returnTo, setReturnTo] = useState("/mypage");

  // ✅ URLクエリは useSearchParams で取得（window 触らない）
  useEffect(() => {
    const ret = searchParams.get("return") || "/mypage";
    setReturnTo(ret);
    setReady(true);
  }, [searchParams]);

  // ✅ sessionStorage は useEffect 内でのみアクセス
  useEffect(() => {
    try {
      const payload = { order, ts: Date.now() };
      sessionStorage.setItem("structure_quick_pending", JSON.stringify(payload));
    } catch {}
  }, [order]);

  function pick(code: EV) {
    if (locking) return;
    setOrder((prev) => (prev.includes(code) ? prev : [...prev, code]));
  }
  function removeLast() {
    if (locking) return;
    setOrder((prev) => prev.slice(0, -1));
  }
  function resetAll() {
    if (locking) return;
    setOrder([]);
  }
  function goConfirm() {
    if (order.length !== 4) return;
    setLocking(true);
    router.push("/structure/quick/confirm");
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 text-white">
      <h1 className="text-center text-xl font-bold mb-6">クイック判定（1問・順位付け）</h1>
      <p className="text-center text-white/80 mb-8">
        Q. あなたが人生で最も大切にしたいものはどれですか？（大切と思う順番に順位をつけてください。）
      </p>

      <div className="space-y-4 mb-8">
        {CHOICES.map((c) => (
          <button
            key={c.code}
            onClick={() => pick(c.code)}
            disabled={order.includes(c.code)}
            className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-4 disabled:opacity-50"
          >
            <div className="font-semibold">{c.label}</div>
            <div className="text-sm text-white/80">{c.desc}</div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="text-sm text-white/70">現在の順位</div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {order.map((code, i) => (
            <span key={`${code}-${i}`} className="rounded-md bg-white/10 px-3 py-1 text-sm">
              第{i + 1}位：{code}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={removeLast} className="rounded-lg border border-white/20 py-2 hover:bg-white/10">
          ひとつ戻す
        </button>
        <button onClick={resetAll} className="rounded-lg border border-white/20 py-2 hover:bg-white/10">
          リセット
        </button>
        <button
          onClick={goConfirm}
          disabled={order.length !== 4}
          className="rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500 disabled:opacity-50"
        >
          この内容で確認へ
        </button>
      </div>

      <div className="text-center text-sm text-white/60">保存後の戻り先：{returnTo}</div>
    </div>
  );
}
