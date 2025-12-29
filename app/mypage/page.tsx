export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MyPageClient from "./MyPageClient";

export default function Page() {
  return <MyPageClient initialData={{}} userId="guest" />;
}
