'use client';
import { useEffect, useState } from 'react';

type Props = { className?: string };

export default function ClockJST({ className }: Props) {
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());

    const tick = () => setNow(fmt());

    tick(); // 初回即時
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return <span className={className}>{now || '----/--/-- --:--'}</span>;
}
