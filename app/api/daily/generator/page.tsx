// app/daily/generator/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import GeneratorClient from "./GeneratorClient";

export default function Page() {
  return <GeneratorClient />;
}
