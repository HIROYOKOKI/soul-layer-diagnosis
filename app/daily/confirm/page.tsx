export const dynamic = "force-dynamic";
import ConfirmClient from "./ConfirmClient";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">回答の確認</h1>
      <p className="text-sm text-gray-500 mb-6">
        以下の質問に対するあなたの回答を確認し、
        「この内容で回答」を押してください。
      </p>
      <ConfirmClient />
    </main>
  );
}
