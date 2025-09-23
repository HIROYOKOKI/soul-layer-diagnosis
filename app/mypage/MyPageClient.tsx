// app/mypage/MyPageClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
// Radar を後で入れるなら ↓ を有効化（βでは未接続でもOK）
// import { RadarEVAE, type EVAEVector } from "@/components/charts/Charts";

type User = {
  name?: string | null;
  displayId?: string | null;
  avatarUrl?: string | null;
};

type Daily = {
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  score?: number | null;        // 0..100 想定
  created_at?: string | null;   // ISO
};

type Profile = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;   // ISO
};

type MyPageData = {
  user?: User | null;
  daily?: Daily | null;
  profile?: Profile | null;
};

export default function MyPageClient({
  initialData,
  userId,
}: {
  initialData: MyPageData;
  userId: string;
}) {
  // ====== state / memo ======
  const [data, setData] = useState<MyPageData>(initialData ?? {});

  const userName = data.user?.name?.trim() || "No Name";
  const dispId = data.user?.displayId?.trim() || userId;

  // JST表示（Asia/Tokyo）
  const fmtJST = (iso?: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // βではダミー計算を避け、Radarは “データ接続できたら表示” 方針
  // const radarVector: EVAEVector | null = useMemo(() => {
  //   if (typeof data?.daily?.score === "number") {
  //     const v = Math.max(0, Math.min(1, data.daily.score / 100));
  //     return { E: v, V: 0.5, "Λ": 0.5, "Ǝ": 0.5 }; // 仮配置：本接続時に差し替え
  //   }
  //   return null;
  // }, [data?.daily?.score]);

  // ====== sub components ======
  const AvatarImage = ({
    src,
    size = 64,
  }: {
    src?: string | null;
    size?: number;
  }) => (
    <div
      className="relative rounded-full overflow-hidden border border-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={src || "/default-avatar.png"}
        alt="avatar"
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority
      />
    </div>
  );

  const AvatarUpload = ({ userId }: { userId: string }) => {
    const [busy, setBusy] = useState(false);

    const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 軽いバリデーション
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください。");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください。");
        return;
      }

      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("user_id", userId);

        const r
