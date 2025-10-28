// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell';

/* ===== 型 ===== */
type EV = 'E' | 'V' | 'Λ' | 'Ǝ';

type QuickAPI =
  | {
      // 新API（推奨）
      model?: 'EVΛƎ' | 'EΛVƎ' | null;
      label?: string | null;
      created_at?: string | null;
      scores?: Partial<Record<EV, number | null>> | null;
      // 旧スキーマ互換
      type_key?: 'EVΛƎ' | 'EΛVƎ' | null;
      type_label?: string | null;
    }
  | null;

type UserMeta =
  | {
      id?: string;
      name?: string | null;
      user_no?: string | null;      // API: snake_case
      display_id?: string | null;
      avatar_url?: string | null;
    }
  | null;

type DailyRaw =
  | {
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
    }
  | null;

type Daily = (DailyRaw & { displayText?: string | null }) | null;

type Profile =
  | {
      fortune?: string | null;
      personality?: string | null;
      partner?: string | null;
      created_at?: string | null;
    }
  | null;

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

/** Quick（新API or 旧スキーマ）→ 統一 */
const normalizeQuick = (q: QuickAPI | undefined) => {
  if (!q) {
    return {
      model: null as 'EVΛƎ' | 'EΛVƎ' | null,
      label: undefined as string | undefined,
      created_at: undefined as string | undefined,
    };
  }
  const model = (q.model ?? q.type_key ?? null) as 'EVΛƎ' | 'EΛVƎ' | null;
  const labelRaw = q.label ?? q.type_label ?? undefined;
  const label =
    labelRaw ?? (model === 'EVΛƎ' ? '未来志向型' : model === 'EΛVƎ' ? '現実思考型' : undefined);
  return { model, label, created_at: q.created_at ?? undefined };
};

/* ===== コンポーネント ===== */
export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
  daily: ssrDaily,
  profile: ssrProfile,
}: {
  theme?: string | null;
  quick?: QuickAPI;
  daily?: DailyRaw;
  profile?: Profile;
}) {
  /* ---------- ローカル状態 ---------- */
  const [user, setUser] = useState<UserMeta>(null);

  // SSR quick を一度だけ正規化
  const ssrNQuick = useMemo(() => normalizeQuick(ssrQuick), [ssrQuick]);
  const [quickModel, setQuickModel] = useState<'EVΛƎ' | 'EΛVƎ' | null>(ssrNQuick.model);
  const [quickLabel, setQuickLabel] = useState<string | undefined>(ssrNQuick.label);
  const [quickAt, setQuickAt] = useState<string | undefined>(ssrNQuick.created_at);

  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  const [daily, setDaily] = useState<Daily>(normalizeDaily(ssrDaily ?? null));
  const [profile, setProfile] = useState<Profile>(ssrProfile ?? null);

  // すべての fetch を no-store に統一
  const opt: RequestInit = useMemo(() => ({ cache: 'no-store' }), []);

  /* ---------- ユーザー情報（/api/mypage/user-meta） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/user-meta', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setUser(j.item ?? null);
      } catch {
        /* noop */
      }
    })();
  }, [opt]);

  /* ---------- テーマ（/api/theme） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.scope) setTheme(String(j.scope).toUpperCase());
      } catch {
        /* noop */
      }
    })();
  }, [opt]);

  /* ---------- クイック最新（/api/mypage/quick-latest） ---------- */
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
      } catch {
        /* noop */
      }
    })();
  }, [opt]);

  /* ---------- デイリー最新（/api/mypage/daily-latest） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/daily-latest', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setDaily(normalizeDaily(j.item ?? null));
      } catch {
        /* noop */
      }
    })();
  }, [opt]);

  /* ---------- プロフィール最新（/api/mypage/profile-latest） ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/profile-latest', opt);
        const j = await r.json().catch(() => ({}));
        if (j?.ok) setProfile(j.item ?? null);
      } catch {
        /* noop */
      }
    })();
  }, [opt]);

  /* ---------- Shell（フル幅ラッパ） ---------- */
  // 取得後に確実に再描画させるためのキー（quickModel を含める）
  const shellKey = useMemo(
    () =>
      [
        user?.id ?? 'anon',
        user?.user_no ?? 'no-user-no',
        quickModel ?? 'no-quick',
        theme ?? 'no-theme',
      ].join(':'),
    [user?.id, user?.user_no, quickModel, theme]
  );

  return (
    <div className="relative z-10 p-6 text-gray-100 pointer-events-auto space-y-8">
      <div className="w-screen mx-[calc(50%-50vw)] [&_*]:!max-w-none">
        <MyPageShell
          key={shellKey}
          data={{
            user: user
              ? {
                  id: user.id,
                  name: user.name ?? undefined,
                  displayId: user.display_id ?? undefined,
                  avatarUrl: user.avatar_url ?? undefined,
                  // 表示用：snake_case → camelCase
                  userNo: user.user_no ?? undefined,
                }
              : undefined,
            quick:
              quickModel !== null
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
