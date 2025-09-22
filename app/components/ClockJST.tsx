'use client';
import { useEffect, useState } from 'react';

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth()+1}`.padStart(2,'0');
  const day = `${d.getDate()}`.padStart(2,'0');
  const hh = `${d.getHours()}`.padStart(2,'0');
  const mm = `${d.getMinutes()}`.padStart(2,'0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

export default function ClockJST({ className }: { className?: string }) {
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const utc = new Date();
      // JST = UTC+9
      const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
      setNow(fmt(jst));
    };
    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return <span className={className}>{now || '----/--/-- --:--'}</span>;
}
