'use client';

import MyPageShell, { Card } from '@/components/layout/MyPageShell';
import DataBridge from '@/components/layout/DataBridge';
import DailyClient from './DailyClient';

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell>
        <Card title="デイリー（診断）">
          <DailyClient />
        </Card>
      </MyPageShell>
    </DataBridge>
  );
}
