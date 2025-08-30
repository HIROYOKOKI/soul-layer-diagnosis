// components/ui/HeaderIcon.tsx
"use client"

import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
};

export default function HeaderIcon({ src = "/icon-512.png", alt = "EVAE" }: Props) {
  return (
    <div
      className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden
                 ring-1 ring-white/15
                 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,.18),transparent_60%)]
                 shadow-[0_0_0_2px_rgba(255,255,255,.03),0_0_18px_4px_rgba(56,189,248,.22)]"
      aria-hidden="true"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="32px"
        priority
        className="object-cover"
      />
    </div>
  );
}
