// app/mypage/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import MyPageShell from '../../components/layout/MyPageShell'
import DataBridge from '../../components/layout/DataBridge'


export default function Page() {
  return <MyPageClient />;
}
