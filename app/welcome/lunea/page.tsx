"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LuneaOpeningPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      router.replace("/profile");
    };

    v.addEventListener("ended", handleEnded);
    return () => {
      v.removeEventListener("ended", handleEnded);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
      {/* タイトル */}
      <h1 className="mb-6 text-center text-xl font-semibold tracking-wide">
        ソウルレイヤー診断ナビゲーター｜ルネア
      </h1>

      {/* 動画 */}
      <video
        ref={videoRef}
        src="/lunea-opening.mp4"
        autoPlay
        playsInline
        className="w-full h-auto max-w-3xl rounded-lg shadow-lg"
      />
    </main>
  );
}
