'use client';
import MyPageShell from '../../components/layout/MyPageShell';
type EV = 'E'|'V'|'Λ'|'Ǝ';
type Quick = { model?: 'EVΛƎ'|'EΛVƎ'|null; label?: string|null; order?: EV[]|null; created_at?: string|null } | null;

export default function MyPageClientWrapper({ theme, quick }: { theme?: string|null; quick?: Quick }) {
  return (
    <MyPageShell
      data={{
        theme: theme ? { name: theme, updated_at: null } : undefined,
        quick: quick ? {
          model: quick.model ?? undefined,
          label: quick.label ?? undefined,
          order: (quick.order ?? undefined) as EV[]|undefined,
          created_at: quick.created_at ?? undefined,
        } : undefined,
      }}
    />
  );
}
