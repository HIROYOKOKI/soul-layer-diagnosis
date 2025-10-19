import { redirect } from "next/navigation";

export default function Page() {
  // 誤アクセスを結果ページへ誘導
  redirect("/daily/result");
}
