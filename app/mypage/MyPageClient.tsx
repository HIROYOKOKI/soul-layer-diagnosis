// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  RadarChart as RcRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
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
  score?: number | null;
  evla?: Partial<Record<EV | "L" | "Eexists", number>> | null;
  slot?: "morning" | "noon" | "night" | null;
  theme?: string | null;
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

type RadarPoint = { key: EV; label: EV; value: number };

// /api/me の戻り（あなたの route.ts 仕様に合わせた最小）
type MeResponse =
  | { ok: true; id: string; idNo?: number | null; idNoStr?: string | null; user?: any }
  | { ok: false; error?: string };

export default function MyPageClient({
  initialData,
  userId,
}: {
  initialData: MyPageData;
  userId: string;
}) {
  const [data, setData] = useState<MyPageData>(initialData ?? {});
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingMe, setLoadingMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const userName = data.user?.name?.trim() || "No Name";
  const dispId = data.user?.displayId?.trim() || userId;

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
      return String(iso);
    }
  };

  const norm01 = (v: unknown) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    const n = v > 1 ? v / 100 : v;
    return Math.max(0, Math.min(1, n));
  };

  // ✅ user: /api/me から取得（本物に置き換える）
  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoadingMe(true);
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = (await r.json().catch(() => ({} as any))) as MeResponse;

        if (aborted) return;

        // 未ログインなら login に飛ばす（/login が無い場合は /welcome 等に変更）
        if (r.status === 401) {
          window.location.href = "/login";
          return;
        }

        if ((j as any)?.ok) {
          const ok = j as any;

          // displayId は idNoStr → idNo → user.id の順で優先
          const displayId =
            (ok.idNoStr ? String(ok.idNoStr) : null) ??
            (ok.idNo != null ? String(ok.idNo) : null) ??
            (ok.id ? String(ok.id) : null) ??
            "unknown";

          // name は、現状 /api/me が user を返してないので仮：あとでprofiles連携する
          // まずは “No Name” を消すため displayId を名前にも反映
          const name = data.user?.name?.trim() || "User";

          setData((p) => ({
            ...p,
            user: {
              name,
              displayId,
              avatarUrl: p.user?.avatarUrl ?? null,
            },
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!aborted) setLoadingMe(false);
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // daily: 1d:001 → latest
  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoadingDaily(true);
      try {
        const r1 = await fetch("/api/daily/get?id=" + encodeURIComponent("1d:001"));
        const j1 = await r1.json().catch(() => ({} as any));
        if (!aborted && j1?.ok && j1.item) {
          setData((p) => ({ ...p, daily: j1.item as Daily }));
          return;
        }

        const r2 = await fetch("/api/mypage/daily-latest");
        const j2 = await r2.json().catch(() => ({} as any));
        if (!aborted && j2?.ok) {
          setData((p) => ({ ...p, daily: j2.item as Daily }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!aborted) setLoadingDaily(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  // ✅ まずはビルドを通す：ダミー固定（後で evla に戻す）
  const radarData: RadarPoint[] = useMemo(() => {
    return [
      { key: "E", label: "E", value: 0.25 },
      { key: "V", label: "V", value: 0.25 },
      { key: "Λ", label: "Λ", value: 0.25 },
      { key: "Ǝ", label: "Ǝ", value: 0.25 },
    ];
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.12)",
            display: "grid",
            placeItems: "center",
            background: "#fff",
          }}
        >
          {data.user?.avatarUrl ? (
            <Image
              src={data.user.avatarUrl}
              alt="avatar"
              width={44}
              height={44}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 12, opacity: 0.7 }}>No Img</span>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{userName}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            ID: {dispId} {loadingMe ? "（確認中…）" : ""}
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>構造レーダー（暫定表示）</div>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <RcRadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" />
              <PolarRadiusAxis domain={[0, 1]} />
              <Tooltip />
              <Radar dataKey="value" />
            </RcRadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          {loadingDaily ? "Daily読み込み中…" : `Daily更新: ${fmtJST(data.daily?.created_at) || "-"}`}
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Daily</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.55 }}>
          <div>code: {data.daily?.code ?? "-"}</div>
          <div>comment: {data.daily?.comment ?? "-"}</div>
          <div>advice: {data.daily?.advice ?? "-"}</div>
          <div>affirm: {data.daily?.affirm ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}
