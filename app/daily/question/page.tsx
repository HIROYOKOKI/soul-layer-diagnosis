export const dynamic = "force-dynamic";
import QuestionClient from "./QuestionClient";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">DAILY 設問</h1>
      <QuestionClient />
    </main>
  );
}
