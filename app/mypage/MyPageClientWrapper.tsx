'use client';
import MyPageShell from '../../components/layout/MyPageShell';

export default function MyPageClientWrapper({ theme }: { theme?: string | null }) {
  return <MyPageShell data={{ theme: { name: theme ?? undefined } }} />;
}
