"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Payload = {
  name: string; birthday: string;
  blood: "A"|"B"|"O"|"AB";
  gender: "Male"|"Female"|"Other";
  preference?: string | null;
};
type Resp = { ok: true; result: { luneaLines: string[] } } | { ok:false; error:string };

export default function DiagnoseClient() {
  const router = useRouter();
  const [form, setForm] = useState<Payload>({
    name:"Hiro", birthday:"1985-05-05", blood:"A", gender:"Male", preference:"Unset",
  });
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string|null>(null);

  async function run() {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/profile/diagnose", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form),
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Resp;
      if(!json.ok) throw new Error(json.error || "diagnose_failed");

      const lines = json.result.luneaLines ?? [];
      // 結果を保存（DB & 結果ページへ受け渡し）
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(lines));
      await fetch("/api/profile/save", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ luneaLines: lines }),
      });
      router.push("/profile/result");
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4 max-w-md">
      <h1 className="text-xl font-semibold">ルネア診断（ワンステップ）</h1>

      <label className="grid gap-1">
        <span className="text-sm text-gray-600">名前</span>
        <input className="px-3 py-2 rounded border" value={form.name}
               onChange={e=>setForm({...form, name:e.target.value})}/>
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-gray-600">誕生日</span>
        <input type="date" className="px-3 py-2 rounded border" value={form.birthday}
               onChange={e=>setForm({...form, birthday:e.target.value})}/>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">血液型</span>
          <select className="px-3 py-2 rounded border" value={form.blood}
                  onChange={e=>setForm({...form, blood:e.target.value as Payload["blood"]})}>
            {["A","B","O","AB"].map(b=> <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">性別</span>
          <select className="px-3 py-2 rounded border" value={form.gender}
                  onChange={e=>setForm({...form, gender:e.target.value as Payload["gender"]})}>
            {["Male","Female","Other"].map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
      </div>

      <button onClick={run} disabled={loading}
              className="px-4 py-2 rounded-2xl bg-black text-white">
        {loading ? "診断中…" : "ルネアに診断してもらう"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
