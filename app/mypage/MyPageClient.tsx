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

        const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || `Upload failed (${res.status})`);
        }

        // 直後にUIへ反映
        setData((prev) => ({
          ...prev,
          user: { ...(prev.user ?? {}), avatarUrl: json.url as string },
        }));
      } catch (err: any) {
        console.error(err);
        alert("アップロードに失敗しました：" + (err?.message || "unknown error"));
      } finally {
        setBusy(false);
        // 同じファイル選択でも onChange が発火するように
        e.target.value = "";
      }
    };

    return (
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-white/80">
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition">
          画像を選ぶ
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        {busy && <span className="text-white/60">アップロード中…</span>}
      </label>
    );
  };

  // ====== UI ======
  return (
    <div className="p-4 space-y-6">
      {/* ユーザー行 */}
      <div className="flex items-center gap-4">
        <AvatarImage src={data.user?.avatarUrl} />
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{userName}</div>
          <div className="text-xs text-white/60">ID: {dispId}</div>
        </div>
      </div>

      {/* 画像アップロード */}
      <div>
        <AvatarUpload userId={userId} />
      </div>

      {/* （任意）Radar：データが繋がったら表示 */}
      {/* {radarVector && (
        <section className="rounded-2xl border border-white/10 bg-black/60 p-4">
          <h2 className="text-sm text-white/70 mb-3">現在のバランス（Radar）</h2>
          <RadarEVAE vector={radarVector} order={["E", "V", "Λ", "Ǝ"]} size={300} />
          <p className="mt-2 text-xs text-white/50">※ β版は仮ベクトル。正式接続後に更新されます。</p>
        </section>
      )} */}

      {/* デイリー診断カード */}
      <section className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <h2 className="text-sm text-white/70 mb-2">デイリー診断（最新）</h2>
        {data.daily ? (
          <div className="space-y-2 text-white/90">
            {data.daily.comment && (
              <p>
                <strong>コメント：</strong>
                <span className="align-middle">{data.daily.comment}</span>
              </p>
            )}
            {data.daily.advice && (
              <p>
                <strong>アドバイス：</strong>
                <span className="align-middle">{data.daily.advice}</span>
              </p>
            )}
            {data.daily.affirm && (
              <p>
                <strong>アファ：</strong>
                <span className="align-middle">{data.daily.affirm}</span>
              </p>
            )}
            <p className="text-white/70">
              <strong>スコア：</strong>
              {typeof data.daily.score === "number"
                ? data.daily.score.toFixed(1)
                : "—"}
            </p>
            {data.daily.created_at && (
              <p className="text-xs text-white/50">日時: {fmtJST(data.daily.created_at)}</p>
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
          <div className="space-y-2 text-white/90">
            {data.profile.fortune && (
              <p>
                <strong>運勢：</strong>
                <span className="align-middle">{data.profile.fortune}</span>
              </p>
            )}
            {data.profile.personality && (
              <p>
                <strong>性格：</strong>
                <span className="align-middle">{data.profile.personality}</span>
              </p>
            )}
            {data.profile.partner && (
              <p>
                <strong>理想：</strong>
                <span className="align-middle">{data.profile.partner}</span>
              </p>
            )}
            {data.profile.created_at && (
              <p className="text-xs text-white/50">日時: {fmtJST(data.profile.created_at)}</p>
            )}
          </div>
        ) : (
          <p className="text-white/60">プロフィール診断は未実施です。</p>
        )}
      </section>
    </div>
  );
}
