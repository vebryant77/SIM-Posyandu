'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowRightLeft,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardPlus,
  Clock3,
  FileChartColumn,
  House,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Send,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  checkupInput,
  dateLabel,
  periodLabel,
  scheduleInput,
  text,
  type Complaint,
  type DashboardData,
  type Profile,
  type Schedule,
} from '@/lib/posyandu'
import { post } from './requests'
import { Examination, Reports } from './clinical'
import { demoCheckups, demoProfiles, demoSchedules, demoToday } from './demo'
import {
  clockWib,
  Modal,
  ScheduleForm,
  SchedulesView,
  Stat,
  statusFor,
  timeLabel,
  type Save,
} from './schedules'
import {
  BannerArt,
  Brand,
  Button,
  Empty,
  Label,
  Notice,
  TextInput,
  Textarea,
  Title,
  outline,
  panel,
} from './ui'

type Tab = 'home' | 'schedule' | 'exam' | 'reports' | 'complaints'
const navigation = {
  home: { icon: House, label: 'Dasbor Warga' },
  schedule: { icon: CalendarDays, label: 'Jadwal Posyandu' },
  exam: { icon: ClipboardPlus, label: 'Pemeriksaan Balita' },
  reports: { icon: FileChartColumn, label: 'Laporan Posyandu' },
  complaints: { icon: MessageSquare, label: 'Keluhan Warga' },
}
const blank: DashboardData = { schedules: [], notifications: [], checkups: [], complaints: [] }
const sample = {
  schedules: demoSchedules,
  notifications: [...demoSchedules].reverse(),
  checkups: demoCheckups,
  complaints: [],
}

export function Workspace({
  initial,
  currentDay,
  demo = false,
}: {
  initial: Profile
  currentDay: string
  demo?: boolean
}) {
  const today = demo ? demoToday : currentDay
  const [period, setPeriod] = useState(today.slice(0, 7))
  const [clock, setClock] = useState('00:00')
  const [profile, setProfile] = useState(initial)
  const [demoResident, setDemoResident] = useState(demoProfiles.warga)
  const [tab, setTab] = useState<Tab>(initial.role === 'kader' ? 'schedule' : 'home')
  const [dataset, setDataset] = useState(demo ? sample : blank)
  const [loaded, setLoaded] = useState(demo ? period : '')
  const [issue, setIssue] = useState('')
  const [toast, setToast] = useState('')
  const [edit, setEdit] = useState<Schedule | true | null>(null)
  const [detail, setDetail] = useState<Schedule | null>(null)
  const [bell, setBell] = useState(false)
  const [seen, setSeen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const kader = profile.role === 'kader'
  const loading = !demo && loaded !== period && !issue
  const rows = demo
    ? dataset.schedules.filter((row) => row.day.startsWith(period))
    : loaded === period
      ? dataset.schedules
      : []
  const checks = demo
    ? dataset.checkups.filter((row) => row.day.startsWith(period))
    : loaded === period
      ? dataset.checkups
      : []
  const upcoming = rows.filter((row) => statusFor(row, today, clock) === 'Terjadwal')
  const done = rows.length - upcoming.length
  const alerts = kader
    ? [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : dataset.notifications
  const tabs: Tab[] = kader ? ['schedule', 'exam', 'reports', 'complaints'] : ['home', 'schedule']
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (demo) return
    const update = () => setClock(clockWib())
    update()
    const interval = window.setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [demo])

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (demo) return
      try {
        const response = await fetch(`/api/posyandu?period=${period}`, {
          cache: 'no-store',
          signal,
        })
        if (response.status === 401) {
          window.location.assign('/masuk')
          return
        }
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        if (signal?.aborted) return
        setDataset(result.data)
        setProfile(result.profile)
        setLoaded(period)
        setIssue('')
      } catch (error) {
        if (!signal?.aborted)
          setIssue(error instanceof Error ? error.message : 'Data belum dapat dimuat.')
      }
    },
    [demo, period],
  )

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    if (demo) return
    const onFocus = () => {
      void refresh(controller.signal)
    }
    window.addEventListener('focus', onFocus)
    const timer = !kader ? window.setInterval(onFocus, 30_000) : undefined
    return () => {
      controller.abort()
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [demo, kader, refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])

  const change = (next: string) => {
    setIssue('')
    setPeriod(next)
  }
  const navigate = (next: Tab) => {
    setTab(next)
    setMobile(false)
    setBell(false)
    window.scrollTo({ top: 0 })
  }
  const switchRole = () => {
    setProfile(kader ? demoResident : demoProfiles.kader)
    setBell(false)
    setSeen(false)
    navigate(kader ? 'home' : 'schedule')
  }
  const save: Save = async (action, data) => {
    if (demo) {
      if (action === 'schedule') {
        const schedule = scheduleInput(data)
        const existing = dataset.schedules.find((row) => row.id === data.id)
        const row = {
          ...schedule,
          id: existing?.id ?? crypto.randomUUID(),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        }
        setDataset((old) => ({
          ...old,
          schedules: [...old.schedules.filter((item) => item.id !== row.id), row].sort((a, b) =>
            (a.day + a.start).localeCompare(b.day + b.start),
          ),
          notifications: existing
            ? old.notifications.map((item) => (item.id === row.id ? row : item))
            : [row, ...old.notifications],
        }))
      } else if (action === 'checkup') {
        const row = checkupInput(data, today)
        setDataset((old) => ({
          ...old,
          checkups: [{ ...row, id: crypto.randomUUID() }, ...old.checkups],
        }))
      } else if (action === 'complaint') {
        const title = text(data, 'title', 100, 'judul')
        const message = text(data, 'message', 1500, 'keluhan', 5)
        setDataset((old) => ({
          ...old,
          complaints: [
            { id: crypto.randomUUID(), title, message, createdAt: today },
            ...old.complaints,
          ],
        }))
      } else if (action === 'profile') {
        const profile = {
          ...demoResident,
          name: text(data, 'name', 100, 'nama lengkap', 2),
          phone: text(data, 'phone', 24, 'nomor telepon', 0),
          address: text(data, 'address', 300, 'alamat', 0),
        }
        setDemoResident(profile)
        setProfile(profile)
      }
    } else {
      await post(action, data)
    }
    if (
      (action === 'schedule' || action === 'checkup') &&
      typeof data.day === 'string' &&
      data.day.slice(0, 7) !== period
    )
      change(data.day.slice(0, 7))
    else if (!demo) await refresh()
    setToast(
      {
        schedule: data.id
          ? 'Jadwal berhasil diperbarui.'
          : 'Jadwal tersimpan dan muncul di notifikasi warga.',
        checkup: 'Pemeriksaan tersimpan di laporan bulanan.',
        complaint: 'Keluhan berhasil dikirim ke kader.',
        profile: 'Data diri berhasil diperbarui.',
      }[action] ?? 'Berhasil disimpan.',
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.25rem_minmax(0,1fr)]">
      {mobile && (
        <Button
          variant="plain"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
          className="fixed inset-0 z-40 rounded-none! bg-p900/35! lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-61 flex-col border-r border-line bg-white transition-transform lg:sticky lg:top-0 lg:z-20 lg:h-dvh lg:translate-x-0 ${mobile ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex min-h-19 items-center justify-between px-5">
          <Brand />
          <Button
            variant="plain"
            className="px-2 lg:hidden"
            aria-label="Tutup menu"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl border border-p200/70 bg-p100/65 p-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-p200/70 text-p700">
            <MapPin size={16} />
          </span>
          <div>
            <p className="text-xs font-extrabold text-p900">Posyandu Melati</p>
            <p className="mt-0.5 text-[0.68rem] font-medium text-muted">Desa Sukamaju</p>
          </div>
        </div>
        <nav className="mx-4 mt-7 space-y-1" aria-label="Menu utama">
          <p className="mb-3 px-2 text-[0.65rem] font-extrabold tracking-[0.15em] text-muted uppercase">
            {kader ? 'Menu kader' : 'Menu warga'}
          </p>
          {tabs.map((id) => {
            const { icon: Icon, label } = navigation[id]
            return (
              <Button
                key={id}
                variant="plain"
                aria-current={id === tab ? 'page' : undefined}
                onClick={() => navigate(id)}
                className={`w-full justify-start gap-2.5! px-3 py-2.5 text-[0.82rem]! ${id === tab ? 'bg-p100! text-p700! ring-1 ring-p200/70 ring-inset' : 'font-semibold! text-muted!'}`}
              >
                <Icon size={17} className="shrink-0" />
                {label}
                {id === tab && <span className="ml-auto size-1.5 rounded-full bg-p500" />}
              </Button>
            )
          })}
        </nav>
        <div className="mt-auto px-4 pb-4">
          {demo && (
            <div className="mb-4 rounded-xl border border-line bg-canvas p-3">
              <p className="text-[0.68rem] font-extrabold tracking-wider text-muted uppercase">
                Mode demonstrasi
              </p>
              <Button
                variant="plain"
                onClick={switchRole}
                className="mt-1 w-full justify-start px-1 text-xs!"
              >
                <ArrowRightLeft size={15} /> Lihat sebagai {kader ? 'Warga' : 'Kader'}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2.5 border-t border-line pt-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-p200 text-xs font-extrabold text-p800">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold">{profile.name}</p>
              <p className="mt-0.5 text-[0.68rem] font-medium text-muted">
                {kader ? 'Kader Posyandu' : 'Warga'}
              </p>
            </div>
            {!demo && (
              <Button
                variant="plain"
                className="px-2"
                aria-label="Keluar"
                onClick={async () => {
                  try {
                    await post('logout')
                    window.location.assign('/masuk')
                  } catch {
                    setIssue('Belum dapat keluar. Silakan coba lagi.')
                  }
                }}
              >
                <LogOut size={17} />
              </Button>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="relative z-10 flex min-h-17 items-center justify-between gap-2 border-b border-line bg-white px-4 sm:px-7 xl:px-9">
          <div className="flex min-w-0 items-center gap-2.5 text-sm">
            <Button
              variant="plain"
              aria-label="Buka menu"
              className="px-1 lg:hidden"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </Button>
            <House size={17} className="hidden shrink-0 text-muted sm:block" />
            <span className="hidden font-medium text-muted sm:inline">
              Dasbor {kader ? 'Kader' : 'Warga'}
            </span>
            <ChevronRight size={14} className="hidden shrink-0 text-slate-400 sm:block" />
            <span className="truncate font-extrabold">{navigation[tab].label}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {demo && (
              <span
                title="Perubahan demo tidak disimpan"
                className="hidden items-center gap-1.5 rounded-full border border-p200 bg-p100 px-2.5 py-1.5 text-[0.68rem] font-bold text-p700 min-[390px]:inline-flex"
              >
                <span className="size-1.5 rounded-full bg-p500" /> Data contoh
              </span>
            )}
            <Button
              variant="icon"
              aria-label="Notifikasi"
              aria-expanded={bell}
              className="relative size-9!"
              onClick={() => {
                setBell(!bell)
                setSeen(true)
              }}
            >
              <Bell size={17} />
              {alerts.length > 0 && !seen && (
                <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-p500 ring-2 ring-white" />
              )}
            </Button>
            {demo && (
              <Link href="/masuk" className={`${outline} min-h-9! px-2.5! text-xs!`}>
                <LogIn size={15} /> Masuk
              </Link>
            )}
          </div>
          {bell && (
            <div
              className={`${panel} absolute top-full right-3 z-30 mt-2 w-[calc(100%-1.5rem)] max-w-sm overflow-hidden sm:right-7`}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <Title level={3}>Notifikasi jadwal</Title>
                <Button
                  variant="plain"
                  aria-label="Tutup notifikasi"
                  onClick={() => setBell(false)}
                >
                  <X size={17} />
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="p-5 text-sm text-muted">Belum ada notifikasi jadwal.</p>
                ) : (
                  alerts.map((row) => (
                    <Button
                      variant="plain"
                      className="w-full justify-start rounded-none! border-b border-line px-4 py-3 text-left"
                      key={row.id}
                      onClick={() => {
                        setBell(false)
                        setDetail(row)
                      }}
                    >
                      <CalendarDays size={17} className="shrink-0" />
                      <span>
                        <span className="block">{row.title}</span>
                        <span className="mt-0.5 block text-xs font-medium text-muted">
                          {dateLabel(row.day)} · {timeLabel(row)}
                        </span>
                      </span>
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-[98rem] space-y-6 px-4 pt-6 pb-8 sm:px-7 sm:pt-7 xl:px-9">
          {issue && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"
            >
              {issue}
              <Button variant="plain" onClick={() => refresh()}>
                Coba lagi
              </Button>
            </div>
          )}
          {((tab === 'schedule' && kader) || tab === 'home') && (
            <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-r from-p700 via-p600 to-p500 px-5 py-7 text-white sm:px-8 sm:py-7">
              <BannerArt className="pointer-events-none absolute -right-5 -bottom-2 -z-10 h-[110%] w-auto opacity-20 sm:right-0 sm:opacity-100" />
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[0.64rem] leading-none font-extrabold tracking-[0.13em] text-p100 uppercase">
                  <span className="size-1.5 rounded-full bg-p300" /> Ruang kerja{' '}
                  {kader ? 'kader' : 'warga'}
                </span>
                <Title className="mt-3 text-display! sm:text-hero!">
                  Selamat datang, {profile.name}!
                </Title>
                <p className="mt-2 max-w-md text-sm leading-relaxed font-medium text-p100/90 sm:text-[0.92rem]">
                  {kader
                    ? 'Kelola jadwal pelayanan dan pantau kegiatan Posyandu Melati dari satu tempat.'
                    : 'Lihat jadwal terbaru, kelola data diri, dan sampaikan keluhan kepada kader Posyandu.'}
                </p>
              </div>
            </section>
          )}
          {tab === 'schedule' && (
            <>
              {kader && (
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  <Stat
                    icon={CalendarDays}
                    value={loading ? '—' : rows.length}
                    label="Total kegiatan"
                    helper={periodLabel(period)}
                  />
                  <Stat
                    icon={Clock3}
                    value={loading ? '—' : upcoming.length}
                    label="Akan datang"
                    helper="Kegiatan terjadwal"
                    tone="green"
                  />
                  <Stat
                    icon={CalendarCheck}
                    value={loading ? '—' : done}
                    label="Selesai"
                    helper="Kegiatan terlaksana"
                    tone="blue"
                  />
                </div>
              )}
              <SchedulesView
                rows={rows}
                period={period}
                change={change}
                today={today}
                clock={clock}
                kader={kader}
                open={(row) => setEdit(row ?? true)}
                detail={setDetail}
                loading={loading}
              />
            </>
          )}
          {tab === 'exam' && kader && <Examination today={today} save={save} />}
          {tab === 'reports' && kader && (
            <Reports
              rows={checks}
              schedules={rows}
              period={period}
              change={change}
              today={today}
              clock={clock}
              demo={demo}
              loading={loading || Boolean(issue)}
            />
          )}
          {tab === 'complaints' && kader && (
            <section className="space-y-5">
              <div>
                <Title>Keluhan Warga</Title>
                <p className="mt-2 text-sm text-muted">
                  Tinjau pesan yang dikirim oleh warga Posyandu Melati.
                </p>
              </div>
              <div className={panel}>
                <ComplaintList rows={dataset.complaints} />
              </div>
            </section>
          )}
          {tab === 'home' && !kader && (
            <Resident
              profile={profile}
              schedules={dataset.notifications}
              complaints={dataset.complaints}
              detail={setDetail}
              save={save}
              showSchedule={() => navigate('schedule')}
            />
          )}
          <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-xs font-medium text-muted">
            <span>SIM-Posyandu · Pencatatan pelayanan ibu dan anak</span>
            <span>Posyandu Melati, Desa Sukamaju</span>
          </footer>
        </main>
      </div>
      {edit && (
        <ScheduleForm
          existing={edit === true ? undefined : edit}
          period={period}
          today={today}
          save={save}
          close={() => setEdit(null)}
        />
      )}
      {detail && (
        <Modal
          title={detail.title}
          subtitle="Detail kegiatan Posyandu Melati"
          close={() => setDetail(null)}
        >
          <div className="grid gap-3 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays size={18} className="text-p600" />
              {dateLabel(detail.day, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 size={18} className="text-p600" />
              {timeLabel(detail)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={18} className="text-p600" />
              {detail.location}
            </p>
            {detail.notes && <Notice>{detail.notes}</Notice>}
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setDetail(null)}>
                Tutup
              </Button>
              {kader && (
                <Button
                  onClick={() => {
                    setEdit(detail)
                    setDetail(null)
                  }}
                >
                  <Pencil size={16} /> Ubah Jadwal
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {toast && (
        <div
          role="status"
          className="fixed right-4 bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-p900 px-4 py-3 text-sm font-bold text-white shadow-lg sm:left-auto"
        >
          <Check size={18} className="shrink-0 text-p300" />
          {toast}
          <Button
            variant="plain"
            className="min-h-7! px-1 text-white! hover:bg-white/10!"
            aria-label="Tutup pesan"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}

function ComplaintList({ rows }: { rows: Complaint[] }) {
  return rows.length ? (
    <ul className="divide-y divide-line">
      {rows.map((row) => (
        <li key={row.id} className="p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <p className="text-sm font-extrabold">{row.title}</p>
            <span className="text-xs text-muted">{dateLabel(row.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
            {row.message}
          </p>
        </li>
      ))}
    </ul>
  ) : (
    <Empty icon={MessageSquare} title="Belum ada keluhan">
      Pesan yang telah dikirim akan muncul di sini.
    </Empty>
  )
}

function Resident({
  profile,
  schedules,
  complaints,
  save,
  detail,
  showSchedule,
}: {
  profile: Profile
  schedules: Schedule[]
  complaints: Complaint[]
  save: Save
  detail: (row: Schedule) => void
  showSchedule: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState('')
  const [error, setError] = useState<{ action: string; message: string } | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    setPending(action)
    setError(null)
    try {
      await save(action, data)
      if (action === 'profile') setEditing(false)
      else form.reset()
    } catch (e) {
      setError({
        action,
        message: e instanceof Error ? e.message : 'Perubahan belum dapat disimpan.',
      })
    } finally {
      setPending('')
    }
  }
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-p100 text-p600">
              <Bell size={19} />
            </div>
            <div>
              <Title level={2}>Notifikasi</Title>
              <p className="mt-0.5 text-xs text-muted">Informasi jadwal terbaru dari kader</p>
            </div>
          </div>
          <Button variant="plain" onClick={showSchedule}>
            Semua jadwal <ArrowRight size={15} />
          </Button>
        </div>
        {schedules.length ? (
          <ul className="divide-y divide-line">
            {schedules.slice(0, 5).map((row) => (
              <li key={row.id}>
                <Button
                  variant="plain"
                  onClick={() => detail(row)}
                  className="w-full justify-start rounded-none! px-5 py-3.5 text-left"
                >
                  <CalendarDays size={17} className="shrink-0" />
                  <span className="flex-1">
                    <span className="block text-ink">{row.title}</span>
                    <span className="mt-1 block text-xs font-medium text-muted">
                      {dateLabel(row.day)} · {row.location}
                    </span>
                  </span>
                  <ChevronRight size={16} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={Bell} title="Belum ada notifikasi">
            Jadwal baru yang ditambahkan oleh kader akan muncul di sini.
          </Empty>
        )}
      </section>
      <section className={`${panel} p-5`}>
        <div className="flex items-center justify-between gap-2">
          <Title level={2}>
            <span className="inline-flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-p100 text-p600">
                <UserRound size={19} />
              </span>
              Data diri
            </span>
          </Title>
          {!editing && (
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                setEditing(true)
              }}
            >
              <Pencil size={15} /> Ubah data
            </Button>
          )}
        </div>
        {editing ? (
          <form onSubmit={(e) => submit(e, 'profile')} className="mt-5 grid gap-3">
            <Label label="Nama lengkap">
              <TextInput name="name" defaultValue={profile.name} required maxLength={100} />
            </Label>
            <Label label="Nomor telepon">
              <TextInput
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ''}
                maxLength={24}
              />
            </Label>
            <Label label="Alamat">
              <Textarea name="address" defaultValue={profile.address ?? ''} maxLength={300} />
            </Label>
            {error?.action === 'profile' && (
              <p role="alert" className="text-sm font-bold text-red-700">
                {error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={Boolean(pending)}>
                {pending === 'profile' ? 'Menyimpan…' : 'Simpan data'}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[
              ['Nama lengkap', profile.name],
              ['Alamat email', profile.email],
              ['Nomor telepon', profile.phone],
              ['Alamat', profile.address],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="mb-1 text-xs text-muted">{label}</dt>
                <dd className="font-bold wrap-break-word">{value || 'Belum diisi'}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section className={`${panel} p-5`}>
        <Title level={2}>Sampaikan keluhan</Title>
        <p className="mt-1 text-sm text-muted">
          Pesan ini hanya dapat dilihat oleh Anda dan petugas yang berwenang.
        </p>
        <form onSubmit={(e) => submit(e, 'complaint')} className="mt-4 grid gap-4">
          <Label label="Judul keluhan">
            <TextInput
              name="title"
              placeholder="Contoh: Pertanyaan tentang jadwal imunisasi"
              required
              maxLength={100}
            />
          </Label>
          <Label label="Isi keluhan">
            <Textarea
              name="message"
              placeholder="Tuliskan keluhan atau pertanyaan Anda"
              required
              minLength={5}
              maxLength={1500}
            />
          </Label>
          {error?.action === 'complaint' && (
            <p role="alert" className="text-sm font-bold text-red-700">
              {error.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={Boolean(pending)}>
              <Send size={15} />
              {pending === 'complaint' ? 'Mengirim…' : 'Kirim keluhan'}
            </Button>
          </div>
        </form>
      </section>
      <section className={`${panel} overflow-hidden`}>
        <div className="border-b border-line p-5">
          <Title level={2}>Riwayat keluhan</Title>
          <p className="mt-1 text-sm text-muted">Pesan yang sudah Anda sampaikan kepada kader.</p>
        </div>
        <ComplaintList rows={complaints} />
      </section>
    </div>
  )
}
