"use client";

import LoaderSwitcher from "@/components/LoaderSwitcher";

/**
 * /test-loading ページ
 * 本番環境で MatrixRain ローディングをテストするページ。
 * デプロイ後に https://soul-layer-diagnosis.vercel.app/test-loading で確認できます。
 */
export default function TestLoadingPage() {
  return (
    <LoaderSwitcher
      duration={30000}
      mode="matrix"   // ← MatrixRain 固定（"random" / "glitch" / "crt" も可）
      theme="prod"   // devにすると進捗バー表示
      showCaption
    />
  );
}
