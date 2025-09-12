import Client from "./Client";

// ← ビルド時プリレンダーを抑止（ユーザー依存画面なので動的に）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function Page() {
  return <Client />;
}
