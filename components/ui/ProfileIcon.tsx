"use client"
import Image from "next/image";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number; // px
};

export default function ProfileIcon({
  src,
  alt = "Profile",
  size = 48,      // ← Hiro横の想定サイズ
}: Props) {
  const safeSrc = src && src.trim() !== "" ? src : "/icon-512.png"; // 青光ロゴにフォールバック
  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden
                 ring-1 ring-white/15
                 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,.18),transparent_60%)]
                 shadow-[0_0_0_2px_rgba(255,255,255,.03),0_0_18px_4px_rgba(56,189,248,.22)]"
      style={{ width: size, height: size }}
    >
      <Image
        src={safeSrc}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority
      />
    </div>
  );
}
