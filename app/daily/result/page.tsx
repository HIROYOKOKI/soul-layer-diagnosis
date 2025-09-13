export const dynamic = "force-dynamic";
import ResultClient from "./ResultClient";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">今日の結果</h1>
      <ResultClient />
    </main>
  );
}
