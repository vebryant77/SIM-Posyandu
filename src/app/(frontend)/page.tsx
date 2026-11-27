import { demoProfiles, demoToday } from '@/components/posyandu/demo'
import { Workspace } from '@/components/posyandu/workspace'

export default function HomePage() {
  return <Workspace initial={demoProfiles.kader} currentDay={demoToday} demo />
}
