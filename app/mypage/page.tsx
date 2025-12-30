// app/mypage/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MyPageClientWrapper from "./MyPageClientWrapper";

export default function Page() {
  return <MyPageClientWrapper />;
}
