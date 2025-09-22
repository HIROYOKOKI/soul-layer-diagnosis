// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell';

type QuickAny =
  | { model?: 'EVΛƎ'|'EΛVƎ'|null; label?: string|null; created_at?: string|null }
  | { type_key?: 'EVΛƎ'|'EΛVƎ'|null; type_label?: string|null; created_at?: string|null }
  | null;

export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
}: {
  theme?: string | null;
  quick?: QuickAny;
}) {
  // ===== テーマ：SSR → CSRで上書き（既存のまま） =====
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        setTheme(String(j?.scope ?? 'LIFE').toUpperCase());
      } catch {}
    })();
  }, []);

  // ===== Quick：SSR初期値 → CSRで再取得して確実に反映 =====
  // 正規化関数（APIの形が model/label でも type_key/type_label でもOK）
  const normalize = (q: QuickAny | undefined | null) => {
    const model =
      (q as any)?.model ??
      (q as any)?.type_key ??
      null; // 'EVΛƎ' | 'EΛVƎ' | null

    const labelRaw =
      (q as any)?.label ??
      (q as any)?.type_label ??
      undefined;

    const label =
      labelRaw ??
      (model === 'EVΛƎ' ? '未来志向型' : model === 'EΛVƎ' ? '現実思考型' : undefined);

    return { model, label };
  };

  const init = normalize(ssrQuick);
  const [quickModel, setQuickModel] = useState<'EVΛƎ'|'EΛVƎ'|null>(init.model ?? null);
  const [quickLabel, setQuickLabel] = useState<string | undefined>(init.label);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/mypage/quick-latest', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) {
          const n = normalize(j.item);
          setQuickModel((n.model ?? null) as 'EVΛƎ'|'EΛVƎ'|null);
          setQuickLabel(n.label);
        }
      } catch {}
    })();
  }, []);

  return (
    <MyPageShell
      data={{
        theme: { name: theme, updated_at: null },
        // /mypage は見出しだけ Quick 反映する方針：model/label のみ渡す
        quick:
          quickModel
            ? { model: quickModel, label: quickLabel, created_at: undefined }
            : undefined,
      }}
    />
  );
}
