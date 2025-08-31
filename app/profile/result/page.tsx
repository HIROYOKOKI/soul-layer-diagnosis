import { useRouter } from "next/navigation"

const router = useRouter()
async function onSubmit(payload: any) {
  const res = await fetch("/api/profile/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!json?.ok) {
    alert("診断に失敗しました"); return
  }
  // 結果を一時保存して遷移
  sessionStorage.setItem("lunea_profile_result", JSON.stringify(json.result.luneaLines))
  router.push("/profile/result")
}
