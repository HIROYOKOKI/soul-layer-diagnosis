// app/structure/quick/page.tsx
export const dynamic = "force-dynamic";

import QuickClient from "./QuickClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { return?: string };
}) {
  const ret =
    typeof searchParams?.return === "string" && searchParams.return.length > 0
      ? searchParams.return
      : "/profile/result";

  return <QuickClient returnTo={ret} />;
}
