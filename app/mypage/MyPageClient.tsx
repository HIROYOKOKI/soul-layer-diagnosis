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

// /api/mypage/user-meta の戻り
type UserMetaResponse =
  | {
      ok: true;
      item: {
        id: string;
        name: string | null;
        display_id: string | null;
        avatar_url: string | null;
        user_no: string | null;
      } | null;
      unauthenticated?: boolean;
    }
  | { ok: false; error?: string };

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 12,
  background: "rgba(0,0,0,0.02)",
};

const sectionStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(0,0,0,0.02)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  opacity: 0.75,
  marginBottom: 6,
  letterSpacing: 0.4,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  opacity: 0.92,
  whiteSpace: "pre-wrap",
};

export default function MyPageClient({
  initialData,
  userId,
}: {
  initialData: MyPageData;
  userId: string;
}) {
  const [data, setData] = useState<MyPageData>(initialData ?? {});
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingUserMeta, setLoadingUserMeta] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
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

  // ✅ user-meta：ログインしてなくても Guest をセットして表示継続
  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoadingUserMeta(true);
      try {
        const r = await fetch("/api/mypage/user-meta", { cache: "no-store" });
        const j = (await r.json().catch(() => ({} as any))) as UserMetaResponse;
        if (aborted) return;

        // 🟡 未ログイン → Guest 表示（loginへ飛ばさない）
        if (j?.ok && (j.unauthenticated || !j.item)) {
          setData((p) => ({
            ...p,
            user: {
              name: p.user?.name ?? "Guest",
              displayId: p.user?.displayId ?? "guest",
              avatarUrl: p.user?.avatarUrl ?? null,
            },
          }));
          return;
        }

        // 🟢 ログイン済み → 本物 user を反映
        if (j?.ok && j.item) {
          setData((p) => ({
            ...p,
            user: {
              name: j.item.name ?? p.user?.name ?? "User",
              displayId: j.item.user_no ?? j.item.display_id ?? p.user?.displayId ?? userId,
              avatarUrl: j.item.avatar_url ?? p.user?.avatarUrl ?? null,
            },
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!aborted) setLoadingUserMeta(false);
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Daily（最新）
  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoadingDaily(true);
      try {
        const r2 = await fetch("/api/mypage/daily-latest", { cache: "no-store" });
        const j2 = await r2.json().catch(() => ({} as any));
        if (!aborted && j2?.ok) {
          setData((p) => ({ ...p, daily: (j2.item as Daily) ?? null }));
          return;
        }

        // フォールバック（必要なら残す）
        const r1 = await fetch("/api/daily/get?id=" + encodeURIComponent("1d:001"));
        const j1 = await r1.json().catch(() => ({} as any));
        if (!aborted && j1?.ok && j1.item) {
          setData((p) => ({ ...p, daily: j1.item as Daily }));
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

  // ✅ Profile（最新）
  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoadingProfile(true);
      try {
        const r = await fetch("/api/mypage/profile-latest", { cache: "no-store" });
        const j = await r.json().catch(() => ({} as any));
        if (aborted) return;

        if (j?.ok) {
          setData((p) => ({ ...p, profile: (j.item as Profile) ?? null }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!aborted) setLoadingProfile(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  // ✅ Radar: evla 実データ優先（なければ code/score フォールバック）
  const radarData: RadarPoint[] = useMemo(() => {
    const ev = data.daily?.evla || null;

    if (ev) {
      const e = norm01(ev.E ?? 0);
      const v = norm01(ev.V ?? 0);
      const l = norm01((ev as any)["Λ"] ?? (ev as any).L ?? 0);
      const ee = norm01((ev as any)["Ǝ"] ?? (ev as any).Eexists ?? 0);

      return [
        { key: "E", label: "E", value: e },
        { key: "V", label: "V", value: v },
        { key: "Λ", label: "Λ", value: l },
        { key: "Ǝ", label: "Ǝ", value: ee },
      ];
    }

    const code = (data.daily?.code ?? null) as EV | null;
    const s = norm01(data.daily?.score ?? 0);

    if (code) {
      const base: Record<EV, number> = { E: 0.22, V: 0.22, "Λ": 0.22, "Ǝ": 0.22 };
      base[code] = Math.max(base[code], Math.min(1, 0.35 + s * 0.65));
      return [
        { key: "E", label: "E", value: base.E },
        { key: "V", label: "V", value: base.V },
        { key: "Λ", label: "Λ", value: base["Λ"] },
        { key: "Ǝ", label: "Ǝ", value: base["Ǝ"] },
      ];
    }

    return [
      { key: "E", label: "E", value: 0.25 },
      { key: "V", label: "V", value: 0.25 },
      { key: "Λ", label: "Λ", value: 0.25 },
      { key: "Ǝ", label: "Ǝ", value: 0.25 },
    ];
  }, [data.daily?.evla, data.daily?.code, data.daily?.score]);

  if (!mounted) return null;

  return (
    <div style={{ padding: 20 }}>
      {/* header */}
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
          <div style={{ fontWeight: 900, fontSize: 18 }}>{userName}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            ID: {dispId}{" "}
            {(loadingUserMeta || loadingDaily || loadingProfile) ? "（同期中…）" : ""}
          </div>
        </div>
      </div>

      {/* Radar */}
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>構造レーダー</div>

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

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={pillStyle}>code: {data.daily?.code ?? "-"}</span>
          <span style={pillStyle}>slot: {data.daily?.slot ?? "-"}</span>
          {data.daily?.theme ? <span style={pillStyle}>theme: {data.daily.theme}</span> : null}
        </div>
      </div>

      {/* Daily */}
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Daily</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {fmtJST(data.daily?.created_at) || "-"}
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={sectionStyle}>
            <div style={labelStyle}>comment</div>
            <div style={bodyStyle}>{data.daily?.comment ?? "-"}</div>
          </div>

          <div style={sectionStyle}>
            <div style={labelStyle}>advice</div>
            <div style={bodyStyle}>{data.daily?.advice ?? "-"}</div>
          </div>

          <div style={sectionStyle}>
            <div style={labelStyle}>affirm</div>
            <div style={bodyStyle}>{data.daily?.affirm ?? "-"}</div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Profile</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {loadingProfile ? "読み込み中…" : fmtJST(data.profile?.created_at) || "-"}
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={sectionStyle}>
            <div style={labelStyle}>fortune</div>
            <div style={bodyStyle}>{data.profile?.fortune ?? "-"}</div>
          </div>

          <div style={sectionStyle}>
            <div style={labelStyle}>personality</div>
            <div style={bodyStyle}>{data.profile?.personality ?? "-"}</div>
          </div>

          <div style={sectionStyle}>
            <div style={labelStyle}>partner</div>
            <div style={bodyStyle}>{data.profile?.partner ?? "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
