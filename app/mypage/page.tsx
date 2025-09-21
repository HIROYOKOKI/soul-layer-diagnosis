export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import MyPageClientWrapper from './MyPageClientWrapper' // ← 直後に作る薄ラッパ

export default function Page() {
  return <MyPageClientWrapper />
}
