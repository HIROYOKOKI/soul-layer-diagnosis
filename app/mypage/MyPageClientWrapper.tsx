// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import MyPageShell from '../../components/layout/MyPageShell';

/* ===== 型 ===== */
type QuickAny =
  | { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null }
  | { type_key?: 'EVΛƎ' | 'EΛVƎ' | null; type_label?: string | null; created_at?: string | null }
  | null;

type UserMeta = {
  id: string;
  name?: string | null;
  display_id?: string | null;
  avatar_url?: string | null;
} | null;

type Daily = {
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  score?: number | null;
  created_at?: string | null;
} | null;

type Profile = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;
} | null;

/* ===== コンポーネント ===== */
export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
  daily: ssrDaily,
  profile: ssrProfile,
}: {
  theme?: string | null;
  quick?: QuickAny;
  daily?: Daily;
  profile?: Profile;
}) {
  const supabase = useMemo(() => createClientComponentClient(), []);

  /* ---------- ユーザー情報 ---------- */
  const [user, setUser] = useState<UserMeta>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return;

        const { data: prof, error } = await supabase
          .from('profiles')
          .select('name, display_id, avatar_url')
          .eq('id', uid)
          .maybeSingle();

        if (!error && prof) {
          setUser({
            id: uid,
            name: prof.name ?? null,
            display_id: prof.display_id ?? null,
            avatar_url: prof.avatar_url ?? null,
          });
        }
      } catch (e) {
        console.error('user fetch failed', e);
      }
    })();
  }, [supabase]);

  /* ---------- テーマ ---------- */
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        if (j?.scope) setTheme(String(j.scope).toUpperCase());
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- Quick ---------- */
  const normalizeQuick = (q: QuickAny | undefined | null) => {
    const model = (q as any)?.model ?? (q as any)?.type_key ?? null;
    const labelRaw = (q as any)?.label ?? (q as any)?.type_label ?? undefined;
    const label =
      labelRaw ?? (model === 'EVΛƎ' ? '未来志向型' : model === 'EΛVƎ' ? '現実思考型' : undefined);
    return { model, label };
  };

  const initQuick = normalizeQuick(ssrQuick);
  const [quickModel, setQuickModel] = useState<'EVΛƎ' | 'EΛVƎ' | null>(initQuick.model ?? null);
  const [quickLabel, setQuickLabel] = useState<string | undefined>(initQuick.label);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/quick-latest', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) {
          const n = normalizeQuick(j.item);
          setQuickModel((n.model ?? null) as 'EVΛƎ' | 'EΛVƎ' | null);
          setQuickLabel(n.label);
        }
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- Daily ---------- */
  const [daily, setDaily] = useState<Daily>(ssrDaily ?? null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/daily-latest', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setDaily(j.item);
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- Profile ---------- */
  const [profile, setProfile] = useState<Profile>(ssrProfile ?? null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/profile-latest', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setProfile(j.item);
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- Shell へ ---------- */
  return (
    <div className="relative z-10 p-6 text-gray-100 pointer-events-auto">
      {/* h1 はここだけ（Shell 側は h2/h3 に） */}
      <h1 className="text-2xl font-semibold mb-4">My Page</h1>

      {/* 余計な上部の3ボタンは削除済み。操作は MyPageShell 内の「デイリー診断」だけに集約 */}
      <MyPageShell
        data={{
          user: user
            ? {
                id: user.id,
                name: user.name ?? undefined,
                displayId: user.display_id ?? undefined,
                avatarUrl: user.avatar_url ?? undefined,
              }
            : undefined,
          quick: quickModel
            ? { model: quickModel, label: quickLabel, created_at: undefined }
            : undefined,
          theme: { name: theme, updated_at: null },
          daily: daily ?? undefined,
          profile: profile ?? undefined,
        }}
        userId={user?.id}
      />
    </div>
  );
}
