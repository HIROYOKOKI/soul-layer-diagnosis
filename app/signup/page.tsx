// app/signup/page.tsx
import { redirect } from "next/navigation";

export default function SignupRedirect() {
  redirect("/register"); // メールだけ版へ統一
}
