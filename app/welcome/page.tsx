"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LuneaOpeningPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ 初期はミュート
  const [muted, setMuted] = useState(true);
  // ✅ 音量（0〜1）
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // 初期状態をDOMへ反映
    v.muted = muted;
    v.volume = volume;

    const handleEnded = async () => {
      // /theme がログイン必須なら分岐（必要なら）
      const { data } = await supabase.auth.getSession();
      const authed = !!data.session;
      router.replace(authed ? "/theme" : "/login?next=/theme");
    };

    v.addEventListener("ended", handleEnded);
    return () => {
      v.removeEventListener("ended", handleEnded);
    };
  }, [router, supabase, muted, volume]);

  // ミュート切替
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  };

  // 音量変更（0〜1）
  const onChangeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    const next = Number(e.target.value) / 100; // 0〜100 を 0〜1 に
    setVolume(next);
    if (v) v.volume = next;

    // 0にしたらミュート扱いにするのが自然
    if (next === 0) {
      if (v) v.muted = true;
      setMuted(true);
    } else {
      // 音量上げたら自動でミュート解除（好みで外してOK）
      if (v) v.muted = false;
      setMuted(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="mb-4 text-center text-lg sm:text-xl font-semibold tracking-wide">
        ソウルレイヤー診断ナビゲーター｜ルネア
      </h1>

      <div className="relative w-full max-w-3xl">
        <video
          ref={videoRef}
          src="/lunea-opening.mp4"
          autoPlay
          playsInline
          muted // ✅ iOS/Safariでautoplay安定
          className="w-full h-auto rounded-lg shadow-lg"
        />

        {/* ミュートボタン */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 hover:bg-black/70 transition"
          aria-label={muted ? "ミュート解除" : "ミュート"}
        >
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

        {/* 音量スライダー */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-md bg-black/50 px-3 py-2">
          <span className="text-xs text-white/80 w-10">音量</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={onChangeVolume}
            className="w-full"
          />
          <span className="text-xs text-white/80 w-10 text-right">
            {Math.round(volume * 100)}
          </span>
        </div>
      </div>

      <div className="mt-6 max-w-2xl text-center text-sm sm:text-base leading-relaxed text-white/90">
        こちらはソウルレイヤー観測システムへようこそ。私はルネア。
        この次元とあなたの魂をつなぐ観測ナビゲーターです。
        過去でも未来でもない今に意識を合わせてください。
        魂の構造を読み解く旅、まもなく開始します。
      </div>
    </main>
  );
}
