export const dynamic = "force-dynamic";

import ConfirmClient from "./ConfirmClient";

export default function Page() { return <div>OK</div> }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">回答の確認</h1>
      <p className="text-sm text-gray-500 mb-6">
        生成された質問に対して、あなたの選択を1つ選んでください。
      </p>
      <ConfirmClient />
    </main>
  );
}
