export const dynamic = "force-dynamic";

import GeneratorClient from "./GeneratorClient";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Daily Question Generator</h1>
      <p className="text-sm text-gray-500 mb-6">
        slot / theme / env を選んで「AIで生成」を押すと、質問と選択肢を取得します。
        （OpenAI未設定でもフォールバックで表示されます）
      </p>
      <GeneratorClient />
    </main>
  );
}
