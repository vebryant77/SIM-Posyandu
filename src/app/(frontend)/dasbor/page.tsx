import { redirect } from 'next/navigation'
import { Workspace } from '@/components/posyandu/workspace'
import { appAuth } from '@/lib/app-auth'
import { todayWib } from '@/lib/posyandu'

export const metadata = { title: 'Dasbor | SIM-Posyandu', robots: { index: false, follow: false } }

export default async function DashboardPage() {
  const user = await appAuth.user()
  if (!user) redirect('/masuk')
  return (
    <Workspace
      initial={{
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      }}
      currentDay={todayWib()}
    />
  )
}
