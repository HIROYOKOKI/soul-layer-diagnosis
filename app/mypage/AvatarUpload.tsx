'use client';
import { useState } from 'react';

export default function AvatarUpload({
  userId,
  onUploaded,
}: {
  userId: string;
  onUploaded?: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    fd.append('user_id', userId);

    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    const json = await res.json();
    setBusy(false);

    if (json.ok) onUploaded?.(json.url);
    else alert('アップロード失敗: ' + json.error);
  };

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-white/70">
      <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10">
        画像を選ぶ
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      {busy && <span>アップロード中…</span>}
    </label>
  );
}
