// app/mypage/MyPageClient.tsx
"use client";

import React, { useState } from "react";

type User = {
  name?: string | null;
  displayId?: string | null;
  avatarUrl?: string | null;
};

type MyPageData = {
  user?: User | null;
};

export default function MyPageClient({
  initialData,
  userId,
}: {
  initialData: MyPageData;
  userId: string;
}) {
  const [data, setData] = useState<MyPageData>(initialData);

  // --- サブコンポーネント ---
  const AvatarImage = ({ src, size = 60 }: { src?: string | null; size?: number }) => (
    <img
      src={src ?? "/default-avatar.png"}
      alt="avatar"
      width={size}
      height={size}
      className="rounded-full object-cover border border-white/10"
      style={{ aspectRatio: "1 / 1" }}
    />
  );

  const AvatarUpload = ({ userId }: { userId: string }) => {
    const [busy, setBusy] = useState(false);

    const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      setBusy(true);

      const fd = new FormData();
      fd.append("file", e.target.files[0]);
      fd.append("user_id", userId);

      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const json = await res.json();
      setBusy(false);

      if (json.ok) {
        setData((prev) => ({
          ...prev,
          user: { ...(prev.user ?? {}), avatarUrl: json.url },
        }));
      } else {
        alert("アップロード失敗: " + json.error);
      }
    };

    return (
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-white/70">
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10">
          画像を選ぶ
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        {busy && <span>アップロード中…</span>}
      </label>
    );
  };

  // --- メインUI ---
  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <AvatarImage src={data.user?.avatarUrl} />
        <div>
          <div className="text-base font-semibold">{data.user?.name ?? "No Name"}</div>
          <div className="text-xs text-white/60">ID: {data.user?.displayId ?? userId}</div>
        </div>
      </div>

      <div className="mt-2">
        <AvatarUpload userId={userId} />
      </div>
    </div>
  );
}
