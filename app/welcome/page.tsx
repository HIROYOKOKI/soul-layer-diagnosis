// app/welcome/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const onceRef = useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    (async () => {
      // 1) セッション確認（/auth/callback 経由後の想定）
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.replace("/login?e=nologin");
        return;
      }

      // 2) プロフィール自動作成（存在しなければ作成＆NO付与）
      try {
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // 失敗しても Theme 選択へは進める（/theme 側で再チェックする想定）
      }

      // 3) テーマ選択ページへ強制遷移（ここで保存→/profile へ）
      router.replace("/theme");
    })();
  }, [router, supabase]);

  // ローディング表示のみ（ボタンは出さない：スキップ防止）
  return (
    <main className="flex min-h-dvh items-center justify-center text-white">
      <div className="text-center">
        <p className="text-lg font-medium">初期設定を準備中です…</p>
        <p className="text-white/60 mt-2">数秒後にテーマ選択へ移動します</p>
      </div>
    </main>
  );
}
