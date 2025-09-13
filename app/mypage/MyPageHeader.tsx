// app/mypage/MyPageHeader.tsx
"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import UserCode from "@/components/UserCode";

export default function MyPageHeader() {
  const sb = getBrowserSupabase();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 1) 認証ユーザー取得
      const { data } = await sb.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;

      // 2) ユーザーコード取得（未付与ならサーバー側で生成して返すAPIにしておく）
      const res = await fetch("/api/user/code", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok && json.userCode) setCode(json.userCode);
    })();
  }, [sb]);

  return (
    <div className="flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold">マイページ</h1>
      {code && <UserCode code={code} withEye />}
    </div>
  );
}
