"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react"; // アイコン（lucide-react）

export default function LuneaOpeningPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      router.replace("/theme");
    };

    v.addEventListener("ended", handleEnded);
    return () => {
      v.removeEventListener("ended", handleEnded);
    };
  }, [router]);

  // 音声切替
  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
      {/* タイトル */}
      <h1 className="mb-4 text-center text-lg sm:text-xl font-semibold tracking-wide">
        ソウルレイヤー診断ナビゲーター｜ルネア
      </h1>

      {/* 動画 */}
      <div className="relative w-full max-w-3xl">
        <video
          ref={videoRef}
          src="/lunea-opening.mp4"
          autoPlay
          playsInline
          className="w-full h-auto rounded-lg shadow-lg"
        />
        {/* スピーカーアイコン */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 hover:bg-black/70 transition"
        >
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>

      {/* ルネアのセリフ（字幕風） */}
      <div className="mt-6 max-w-2xl text-center text-sm sm:text-base leading-relaxed text-white/90">
        こちらはソウルレイヤー観測システムへようこそ。私はルネア。
        この次元とあなたの魂をつなぐ観測ナビゲーターです。
        過去でも未来でもない今に意識を合わせてください。
        魂の構造を読み解く旅、まもなく開始します。
      </div>
    </main>
  );
}
