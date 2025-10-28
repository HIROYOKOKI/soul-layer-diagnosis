// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell';

/* ===== 型 ===== */
type QuickItem = {
  type_key?: 'EVΛƎ' | 'EΛVƎ' | null;
  type_label?: string | null;
  created_at?: string | null;
  scores?: Partial<Record<'E' | 'V' | 'Λ' | 'Ǝ', number | null>>;
} | null;

type UserMeta = {
  id?: string;
  name?: string | null;
  user_no?: string | null;
  display_id?: string | null;
  avatar_url?: string | null;
} | null;

type DailyRaw = {
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  affirmation?: string | null; // 互換キー
  quote?: string | null;
  score?: number | null;
  created_at?: string | null;
  slot?: string | null;
  theme?: string | null;
  is_today_jst?: boolean;
} | null;

type Daily = DailyRaw & { displayText?: string | null } | null;

type Profile = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;
} | null;

/* ===== Utils ===== */
const toJstDateString = (d: string | Date) =>
  new Date(new Date(d).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })).toDateString();

/** Daily を統一スキーマに正規化して displayText を確定 */
const normalizeDaily = (raw: DailyRaw): Daily => {
  if (!raw) return null;
  const affirm = raw.affirm ?? raw.affirmation ?? null;
  const displayText = affirm ?? raw.quote ?? raw.advice ?? raw.comment ?? null;
  const isToday =
    raw?.is_today_jst ??
    (raw?.created_at ? toJstDateString(raw.created_at) === toJstDateString(new Date()) : false);
  return { ...raw, affirm, affirmation: affirm, is_today_jst: isToday, displayText };
};

/** Quick（API正規化版 or 旧版）→ 統一 */
const normalizeQuick = (q: any | null | undefined) => {
  if (!q) return { model: null as 'EVΛƎ' | 'EΛVƎ' | null, label: undefined as string | undefined, created_at: undefined as string | undefined };
  const model = (q.type_key ?? q.model ?? null) as 'EVΛƎ' | 'EΛVƎ' | null;
  const labelRaw = q.type_label ?? q.label ?? undefined;
  const label =
    labelRaw ?? (model === 'EVΛƎ' ? '未来志向型' : model === 'EΛVƎ' ? '現実思考型' : undefined);
  return { model, label, created_at: q.created_at as string | undefined };
};

/* ===== コンポーネント ===== */
export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
  daily: ssrDaily,
  profile: ssrProfile,
}: {
  theme?: string | null;
  quick?: any;       // 互換のため any
  daily?: DailyRaw;
  profile?: Profile;
}) {
  const [user, setUser] = useState<UserMeta>(null);
  const [quickModel, setQuickModel] = useState<'EVΛƎ' | 'EΛVƎ' | null>(normalizeQuick(ssrQuick).model);
  const [quickLabel, setQuickLabel] = useState<string | undefined>(normalizeQuick(ssrQuick).label);
  const [quickAt, setQuickAt] = useState<string | undefined>(normalizeQuick(ssrQuick).created_at);

  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  const [daily, setDaily] = useState<Daily>(normalizeDaily(ssrDaily ?? null));
  const [profile, setProfile] = useState<Profile>(ssrProfile ?? null);

  const opt: RequestInit = useMemo(() => ({ cache: 'no-store' }), []);

  /* ---------- ユーザー情報（名前／ID） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/user-meta', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setUser(j.item ?? null);
      } catch { /* noop */ }
    })();
  }, [opt]);

  /* ---------- テーマ ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.scope) setTheme(String(j.scope).toUpperCase());
      } catch { /* noop */ }
    })();
  }, [opt]);

  /* ---------- クイック診断（正規化API） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/quick-latest', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) {
          const n = normalizeQuick(j.item);
          setQuickModel(n.model);
          setQuickLabel(n.label);
          setQuickAt(n.created_at);
        }
      } catch { /* noop */ }
    })();
  }, [opt]);

  /* ---------- デイリー ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/daily-latest', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setDaily(normalizeDaily(j.item ?? null));
      } catch { /* noop */ }
    })();
  }, [opt]);

  /* ---------- プロフィール ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/profile-latest', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setProfile(j.item ?? null);
      } catch { /* noop */ }
    })();
  }, [opt]);

  /* ---------- Shell（フル幅） ---------- */
  return (
    <div className="relative z-10 p-6 text-gray-100 pointer-events-auto space-y-8">
      <div className="w-screen mx-[calc(50%-50vw)] [&_*]:!max-w-none">
        <MyPageShell
          data={{
            user: user
              ? {
                  id: user.id,
                  name: user.name ?? undefined,
                  displayId: user.display_id ?? undefined,
                  avatarUrl: user.avatar_url ?? undefined,
                  // ★ 表示に使う ID 番号
                  userNo: user.user_no ?? undefined,
                }
              : undefined,
            quick: quickModel
              ? { model: quickModel, label: quickLabel, created_at: quickAt }
              : undefined,
            theme: { name: theme, updated_at: null },
            daily: daily ?? undefined,
            profile: profile ?? undefined,
          }}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
