import RegisterFormClient from "./RegisterFormClient"

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">アカウント作成</h1>
      <p className="mt-2 text-sm text-zinc-400">
        メール・パスワードを登録すると、会員コード（BEAK）が自動発行されます。
      </p>
      <div className="mt-6">
        <RegisterFormClient />
      </div>
    </div>
  )
}
