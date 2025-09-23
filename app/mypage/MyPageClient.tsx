// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
// ※ まずは直書きで動作確認。Charts.tsx 経由は後で戻します。
// import { RadarEVAE, type EVAEVector } from "@/components/charts/Charts";
import {
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

export default function MyPageClient({
  initialData,
  userId,
}: {
  initialData: MyPageData;
  userId: string;
}) {
  // ===== state =====
  const [data, setData] = useState<MyPageData>(initialData ?? {});
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [mounted, setMounted] = useState(false); // ← マウント後のみ描画

  useEffect(() => setMounted(true), []);

  const userName = data.user?.name?.trim() || "No Name";
  const dispId = data.user?.displayId?.trim() || userId;

  // ===== utils =====
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

  const norm01 = (v: unknown) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    const n = v > 1 ? v / 100 : v;
    return Math.max(0, Math.min(1, n));
  };

  // ===== fetch daily: 1d:001 → latest =====
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
        !aborted && setLoadingDaily(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // ===== Radar用ダミー or 実データ =====
  // まずは確実に出すため、ダミー固定。動いたら下の実データに差し替え。
  const radarData = useMemo(() => {
    // 実データに切り替える場合はこの block をコメント解除：
    // const ev = data.daily?.evla || null;
    // if (ev) {
    //   return [
    //     { key: "E", label: "E", value: norm01(ev.E ?? 0) },
    //     { key: "V", label: "V", value: norm01(ev.V ?? 0) },
    //     { key: "Λ", label: "Λ", value: norm01((ev as any)["Λ"] ?? (ev as any).L ?? 0) },
    //     { key: "Ǝ", label: "Ǝ", value: norm01((ev as any)["Ǝ"] ?? (ev as any).Eexists ?? 0) },
    //   ];
    // }
    // const code = data.daily?.code as EV | undefined;
    // const s = norm01(data.daily?.score ?? 0.6);
    // const base = { E: 0.25, V: 0.25, "Λ": 0.25, "Ǝ": 0.25 } as
