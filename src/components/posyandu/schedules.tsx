'use client'

import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Ellipsis,
  MapPin,
  Plus,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { dateLabel, periodLabel, scheduleDone, validPeriod, type Schedule } from '@/lib/posyandu'
import { Button, Empty, Label, Notice, TextInput, Textarea, Title, panel } from './ui'

export type Save = (action: string, data: Record<string, unknown>) => Promise<void>
export const timeLabel = (row: Schedule) =>
  `${row.start.replace(':', '.')}–${row.end.replace(':', '.')} WIB`
export const clockWib = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
export const statusFor = (row: Schedule, today: string, time: string) =>
  scheduleDone(row, today, time) ? 'Selesai' : 'Terjadwal'

export function Period({ value, change }: { value: string; change: (value: string) => void }) {
  const move = (offset: number) => {
    const [y, m] = value.split('-').map(Number)
    const target = new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7)
    if (validPeriod(target)) change(target)
  }
  return (
    <div className="flex items-center gap-1">
      <Button variant="icon" aria-label="Bulan sebelumnya" onClick={() => move(-1)}>
        <ChevronLeft size={17} />
      </Button>
      <div className="relative flex h-10 min-w-40 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink">
        <CalendarDays size={16} className="text-p600" />
        <span>{periodLabel(value)}</span>
        <input
          aria-label="Pilih bulan dan tahun"
          type="month"
          value={value}
          onChange={(e) => validPeriod(e.target.value) && change(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker()
            } catch {}
          }}
          className="absolute inset-0 w-full cursor-pointer opacity-0 focus-visible:opacity-100"
        />
      </div>
      <Button variant="icon" aria-label="Bulan berikutnya" onClick={() => move(1)}>
        <ChevronRight size={17} />
      </Button>
    </div>
  )
}

export function Modal({
  title,
  subtitle,
  children,
  close,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  close: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      aria-labelledby="dialog-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl bg-white text-ink shadow-2xl backdrop:bg-p900/45"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-p100 text-p600">
            <CalendarPlus size={22} />
          </span>
          <div>
            <h2 id="dialog-title" className="text-xl font-extrabold tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        <Button variant="icon" aria-label="Tutup dialog" onClick={close}>
          <X size={18} />
        </Button>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  )
}

export function ScheduleForm({
  existing,
  period,
  today,
  save,
  close,
}: {
  existing?: Schedule
  period: string
  today: string
  save: Save
  close: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await save('schedule', {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        ...(existing ? { id: existing.id } : {}),
      })
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Jadwal belum dapat disimpan.')
    } finally {
      setPending(false)
    }
  }
  return (
    <Modal
      title={existing ? 'Ubah Jadwal' : 'Tambah Jadwal'}
      subtitle="Lengkapi data kegiatan pelayanan Posyandu."
      close={close}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Label label="Nama kegiatan *">
          <TextInput
            name="title"
            required
            maxLength={140}
            defaultValue={existing?.title}
            placeholder="Contoh: Penimbangan dan pemeriksaan balita"
            autoFocus
          />
        </Label>
        <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr]">
          <Label label="Tanggal kegiatan *">
            <TextInput
              type="date"
              name="day"
              required
              defaultValue={existing?.day ?? (today.startsWith(period) ? today : `${period}-01`)}
            />
          </Label>
          <Label label="Waktu mulai (WIB) *">
            <TextInput
              type="time"
              name="start"
              required
              defaultValue={existing?.start ?? '08:00'}
            />
          </Label>
          <Label label="Waktu selesai (WIB) *">
            <TextInput type="time" name="end" required defaultValue={existing?.end ?? '11:00'} />
          </Label>
        </div>
        <Label label="Lokasi *">
          <TextInput
            name="location"
            required
            maxLength={180}
            defaultValue={existing?.location}
            placeholder="Contoh: Balai Desa Sukamaju"
          />
        </Label>
        <Label label="Keterangan (opsional)">
          <Textarea
            name="notes"
            maxLength={500}
            defaultValue={existing?.notes ?? ''}
            placeholder="Contoh: Mohon membawa Buku KIA."
          />
        </Label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            <Check size={17} />
            {pending ? 'Menyimpan…' : 'Simpan Jadwal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function Stat({
  icon: Icon,
  value,
  label,
  helper,
  tone = 'teal',
}: {
  icon: typeof CalendarDays
  value: number | string
  label: string
  helper: string
  tone?: 'teal' | 'green' | 'blue'
}) {
  const color = {
    teal: 'bg-p100 text-p600',
    green: 'bg-g100 text-g500',
    blue: 'bg-sky-50 text-sky-700',
  }[tone]
  return (
    <div className={`${panel} flex items-center gap-3.5 px-4 py-4 sm:px-5`}>
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon size={21} strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.79rem] font-bold text-muted">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl leading-none font-extrabold tracking-tight">{value}</span>
          <span className="text-xs text-muted">{helper}</span>
        </div>
      </div>
    </div>
  )
}

export function SchedulesView({
  rows,
  period,
  change,
  today,
  clock,
  kader,
  open,
  detail,
  loading,
}: {
  rows: Schedule[]
  period: string
  change: (period: string) => void
  today: string
  clock: string
  kader: boolean
  open: (row?: Schedule) => void
  detail: (row: Schedule) => void
  loading?: boolean
}) {
  return (
    <section className="space-y-5" aria-labelledby="schedule-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div id="schedule-heading">
            <Title level={2} className="text-2xl!">
              Jadwal Posyandu
            </Title>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Lihat tanggal, waktu, dan lokasi setiap kegiatan Posyandu.
          </p>
        </div>
        {kader && (
          <Button onClick={() => open()} className="min-h-11">
            <Plus size={18} /> Tambah Jadwal
          </Button>
        )}
      </div>
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <Title level={3}>Kegiatan bulan ini</Title>
            <p className="mt-1 text-xs font-medium text-muted">
              {rows.length} kegiatan · {periodLabel(period)}
            </p>
          </div>
          <Period value={period} change={change} />
        </div>
        {loading ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-muted">
            Memuat jadwal…
          </p>
        ) : rows.length === 0 ? (
          <Empty icon={CalendarDays} title="Belum ada jadwal">
            Tidak ada kegiatan pada periode ini. Pilih bulan lain
            {kader ? ' atau tambah jadwal baru' : ''}.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-y border-p200/70 bg-p100 text-xs font-bold text-p800">
                <tr>
                  {['Tanggal', 'Kegiatan', 'Waktu', 'Lokasi', 'Status', 'Aksi'].map((name) => (
                    <th
                      key={name}
                      scope="col"
                      className={`px-3 py-3.5 whitespace-nowrap first:pl-5 last:pr-5 ${name === 'Aksi' ? 'w-14 text-center' : ''}`}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const status = statusFor(row, today, clock)
                  return (
                    <tr key={row.id} className="transition hover:bg-p100/35">
                      <td className="py-3 pr-3 pl-5">
                        <div className="flex min-w-23 items-center gap-2.5">
                          <div className="grid size-11 shrink-0 content-center rounded-lg bg-p100 text-center leading-none text-p700">
                            <span className="text-base font-extrabold">{row.day.slice(-2)}</span>
                            <span className="mt-1 text-[0.62rem] font-extrabold uppercase">
                              {dateLabel(row.day, { month: 'short' }).slice(0, 3)}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted">
                            {dateLabel(row.day, { weekday: 'long' })}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-68 px-3 py-3">
                        <p className="font-bold leading-snug">{row.title}</p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {row.notes || 'Posyandu Melati'}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Clock3 size={15} className="text-muted" />
                          {timeLabel(row)}
                        </div>
                      </td>
                      <td className="max-w-47 px-3 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <MapPin size={15} className="shrink-0 text-muted" />
                          {row.location}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold whitespace-nowrap ${status === 'Selesai' ? 'bg-slate-100 text-slate-600' : 'bg-g100 text-g500'}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${status === 'Selesai' ? 'bg-slate-400' : 'bg-emerald-600'}`}
                          />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 pr-5 pl-3 text-center">
                        <Button
                          variant="plain"
                          aria-label={`Lihat detail ${row.title}`}
                          onClick={() => detail(row)}
                          className="size-8! min-h-8! px-0"
                        >
                          <Ellipsis size={19} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Notice>
        <strong>Pengingat Buku KIA.</strong>{' '}
        {kader
          ? 'Ingatkan warga untuk membawa Buku KIA saat mengikuti pelayanan Posyandu.'
          : 'Bawa Buku KIA saat mengikuti kegiatan Posyandu.'}
      </Notice>
    </section>
  )
}
