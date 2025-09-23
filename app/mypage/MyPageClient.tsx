// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RadarEVAE, type EVAEVector } from "@/components/charts/Charts";
import {
  ResponsiveContainer,
  RadarChart as RcRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";


type EV = "E" | "V" | "Λ" | "Ǝ";

type User = {
  name?: string | null;
  displayId?: string | null;
  avatarUrl?: string | null;
};

type Daily = {
  code?: EV | null;
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  score?: number | null;        // 0..100 想定（0..1でも可：正規化で吸収）
  evla?: Partial<Record<EV | "L" | "Eexists", number>> | null; // "Λ"/"Ǝ" 互換キーも許容
  slot?: "morning" | "noon" | "night" | null;
  theme?: string | null;
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
  // ====== state ======
  const [data, setData] = useState<MyPageData>(initialData ?? {});
  const [loadingDaily, setLoadingDaily] = useState(false);

  const userName = data.user?.name?.trim() || "No Name";
  const dispId = data.user?.displayId?.trim() || userId;

  // ====== utils ======
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

  // 0..100 でも 0..1 でも受け取り、0..1に正規化
  const norm01 = (v: unknown) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    const n = v > 1 ? v / 100 : v;
    return Math.max(0, Math.min(1, n));
  };

  // ====== fetch daily: 1d:001 → だめなら latest ======
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      setLoadingDaily(true);
      try {
        // 1) ID指定（1d:001）
        const r1 = await fetch("/api/daily/get?id=" + encodeURIComponent("1d:001"));
        const j1 = await r1.json().catch(() => ({} as any));
        if (!aborted && j1?.ok && j1.item) {
          setData((p) => ({ ...p, daily: j1.item as Daily }));
          return;
        }
        // 2) フォールバック：最新
        const r2 = await fetch("/api/mypage/daily-latest");
        const j2 = await r2.json().catch(() => ({} as any));
        if (!aborted && j2?.ok) {
          setData((p) => ({ ...p, daily: j2.item as Daily }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        !aborted && setLoadingDaily(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, []);

  // ====== Radar用ベクトル（evla 優先／無ければ code+score から推定） ======
  const radarVector: EVAEVector | null = useMemo(() => {
    const ev = data.daily?.evla || null;
    if (ev) {
      return {
        E: norm01(ev.E ?? 0),
        V: norm01(ev.V ?? 0),
        "Λ": norm01((ev as any)["Λ"] ?? (ev as any).L ?? 0),
        "Ǝ": norm01((ev as any)["Ǝ"] ?? (ev as any).Eexists ?? 0),
      };
    }
    // evlaが無い場合：codeを強め・scoreを反映した簡易ベクトル
    const base: EVAEVector = { E: 0.25, V: 0.25, "Λ": 0.25, "Ǝ": 0.25 };
    const code = data.daily?.code as EV | undefined;
    const s = norm01(data.daily?.score ?? 0.6);
    if (code) base[code] = Math.max(base[code] ?? 0.25, s);
    return data.daily ? base : null;
  }, [data.daily]);

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

        setData((prev) => ({
          ...prev,
          user: { ...(prev.user ?? {}), avatarUrl: json.url as string },
        }));
      } catch (err: any) {
        console.error(err);
        alert("アップロードに失敗しました：" + (err?.message || "unknown error"));
      } finally {
        setBusy(false);
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

    {/* Radar（ダミーデータ直書き・動作確認用） */}
<section className="rounded-2xl border border-white/10 bg-black/60 p-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm text-white/70">現在のバランス（Radar）</h2>
    <span className="text-xs text-white/50">テスト表示</span>
  </div>

  <div style={{ width: "100%", maxWidth: 320 }}>
    <ResponsiveContainer width="100%" height={300}>
      <RcRadarChart
        data={[
          { key: "E", label: "E", value: 0.8 },
          { key: "V", label: "V", value: 0.6 },
          { key: "Λ", label: "Λ", value: 0.4 },
          { key: "Ǝ", label: "Ǝ", value: 0.7 },
        ]}
        outerRadius="78%"
      >
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "white", fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: "white", fontSize: 10 }} tickCount={6} />
        <Tooltip
          formatter={(v: number, _n, p) => [`${(v * 100).toFixed(0)}%`, p.payload.key]}
          contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid #222", borderRadius: 8 }}
          labelStyle={{ color: "#fff" }}
        />
        <Radar
          name="EVΛƎ"
          dataKey="value"
          stroke="#FF4500"
          fill="#FF4500"
          strokeOpacity={0.9}
          fillOpacity={0.18}
        />
      </RcRadarChart>
    </ResponsiveContainer>
  </div>
</section>



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
              {typeof data.daily.score === "number" ? data.daily.score.toFixed(1) : "—"}
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
