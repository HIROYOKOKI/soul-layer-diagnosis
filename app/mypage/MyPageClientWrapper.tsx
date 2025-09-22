// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import MyPageShell from '../../components/layout/MyPageShell';

/* ===== 型（最低限） ===== */
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

/* ===== コンポーネント ===== */
export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
}: {
  theme?: string | null;
  quick?: QuickAny;
}) {
  /* ---------- Supabase クライアント（CSR） ---------- */
  const supabase = useMemo(() => createClientComponentClient(), []);

  /* ---------- ユーザー情報（id / profiles） ---------- */
  const [user, setUser] = useState<UserMeta>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) return;

        const { data: prof, error } = await supabase
          .from('profiles')
          .select('name, display_id, avatar_url')
          .eq('id', uid)
          .maybeSingle();

        if (!error) {
          setUser({
            id: uid,
            name: prof?.name ?? null,
            display_id: prof?.display_id ?? null,
            avatar_url: prof?.avatar_url ?? null,
          });
        }
      } catch {
        /* noop */
      }
    })();
  }, [supabase]);

  /* ---------- テーマ：SSR → CSR 上書き（既存方針） ---------- */
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        setTheme(String(j?.scope ?? 'LIFE').toUpperCase());
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- Quick：SSR初期値 → CSRで再取得（既存方針） ---------- */
  const normalize = (q: QuickAny | undefined | null) => {
    const model = (q as any)?.model ?? (q as any)?.type_key ?? null; // 'EVΛƎ' | 'EΛVƎ' | null
    const labelRaw = (q as any)?.label ?? (q as any)?.type_label ?? undefined;
    const label =
      labelRaw ?? (model === 'EVΛƎ' ? '未来志向型' : model === 'EΛVƎ' ? '現実思考型' : undefined);
    return { model, label };
  };

  const initQuick = normalize(ssrQuick);
  const [quickModel, setQuickModel] = useState<'EVΛƎ' | 'EΛVƎ' | null>(initQuick.model ?? null);
  const [quickLabel, setQuickLabel] = useState<string | undefined>(initQuick.label);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/quick-latest', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) {
          const n = normalize(j.item);
          setQuickModel((n.model ?? null) as 'EVΛƎ' | 'EΛVƎ' | null);
          setQuickLabel(n.label);
        }
      } catch {
        /* noop */
      }
    })();
  }, []);

  /* ---------- MyPageShell へ受け渡し ---------- */
  return (
    <MyPageShell
      data={{
        // ユーザー行（名前/表示ID/アバターURL）
        user: user
          ? {
              name: user.name ?? undefined,
              displayId: user.display_id ?? undefined,
              avatarUrl: user.avatar_url ?? undefined,
            }
          : undefined,
        // 見出し Quick（型だけ）
        quick:
          quickModel
            ? { model: quickModel, label: quickLabel, created_at: undefined }
            : undefined,
        // テーマ（上段の小見出し）
        theme: { name: theme, updated_at: null },
        // 将来: daily / charts などは Shell 内で個別 fetch （現状の方針に合わせる）
      }}
      // アバターアップロード用に userId も渡せるようにしておく
      userId={user?.id}
    />
  );
}
