// components/UserCode.tsx
"use client";

export default function UserCode({ code, withEye=true }: { code: string; withEye?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono tracking-wide">
      {withEye && <span className="opacity-80">𓂀</span>}
      {code}
    </span>
  );
}
