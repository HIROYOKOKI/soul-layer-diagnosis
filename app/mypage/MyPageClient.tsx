"use client";

import React, { useState } from "react";

type User = {
  name?: string | null;
  displayId?: string | null;
  avatarUrl?: string | null;
};

type Daily = {
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  score?: number | null;
  created_at?: string | null;
};

type Profile = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;
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
    <div className="p-4 space-y-6">
      {/* ユーザー情報 */}
      <div className="flex items-center gap-4">
        <AvatarImage src={data.user?.avatarUrl} />
        <div>
          <div className="text-base font-semibold">{data.user?.name ?? "No Name"}</div>
          <div className="text-xs text-white/60">ID: {data.user?.displayId ?? userId}</div>
        </div>
      </div>

      <div>
        <AvatarUpload userId={userId} />
      </div>

      {/* デイリー診断カード */}
      <section className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <h2 className="text-sm text-white/70 mb-2">デイリー診断（最新）</h2>
        {data.daily ? (
          <div className="space-y-2 text-white/90">
            <p><strong>コメント：</strong>{data.daily.comment}</p>
            <p><strong>アドバイス：</strong>{data.daily.advice}</p>
            <p><strong>アファ：</strong>{data.daily.affirm}</p>
            <p className="text-white/70">
              <strong>スコア：</strong>{Number(data.daily.score ?? 0).toFixed(1)}
            </p>
            {data.daily.created_at && (
              <p className="text-xs text-white/50">日時: {new Date(data.daily.created_at).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="text-white/60">まだデイリー診断がありません。</p>
        )}
      </section>

      {/* プロフィール診断カード */}
      <section className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <h2 className="text-sm text-white/70 mb-2">プロフィール診断（最新）</h2>
        {data.profile ? (
          <div className="space-y-1 text-white/90">
            <p><strong>運勢：</strong>{data.profile.fortune}</p>
            <p><strong>性格：</strong>{data.profile.personality}</p>
            <p><strong>理想：</strong>{data.profile.partner}</p>
            {data.profile.created_at && (
              <p className="text-xs text-white/50">日時: {new Date(data.profile.created_at).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="text-white/60">プロフィール診断は未実施です。</p>
        )}
      </section>
    </div>
  );
}
