"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LuneaOpeningPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // 再生終了したらプロフィール入力ページへ遷移
    const handleEnded = () => {
      router.replace("/profile");
    };

    v.addEventListener("ended", handleEnded);
    return () => {
      v.removeEventListener("ended", handleEnded);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black">
      <video
        ref={videoRef}
        src="/lunea-opening.mp4"
        autoPlay
        playsInline
        className="w-full h-auto max-w-3xl"
      />
    </main>
  );
}
