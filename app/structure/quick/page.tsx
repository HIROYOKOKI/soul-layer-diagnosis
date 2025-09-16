// app/structure/quick/page.tsx
import QuickClient from "./QuickClient";

export default function Page() {
  // ※ page.tsx は Server Component のままでOK（子が client でも描画できる）
  return <QuickClient />;
}
