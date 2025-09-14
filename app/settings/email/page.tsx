import { Suspense } from "react";
import EmailSettingsClient from "./EmailSettingsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="px-6 py-10">Loading...</div>}>
      <EmailSettingsClient />
    </Suspense>
  );
}
