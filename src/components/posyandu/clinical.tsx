'use client'

import {
  Activity,
  CalendarDays,
  Check,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Ruler,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  ageMonths,
  assess,
  dateLabel,
  periodLabel,
  validDay,
  type Checkup,
  type Schedule,
} from '@/lib/posyandu'
import { Period, statusFor, timeLabel, type Save } from './schedules'
import { Button, Empty, Label, Notice, Select, TextInput, Title, panel } from './ui'

export const clinicalNote =
  'Hasil ini adalah skrining awal berdasarkan standar WHO (BB/PB atau BB/TB), bukan diagnosis. Hasil perlu diverifikasi tenaga kesehatan. Stunting dinilai dengan indikator PB/U atau TB/U, bukan BB/PB atau BB/TB.'
const formatted = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 })

export function Examination({ today, save }: { today: string; save: Save }) {
  const [birth, setBirth] = useState('')
  const [day, setDay] = useState(today)
  const [sex, setSex] = useState('')
  const [method, setMethod] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const age = validDay(birth) && validDay(day) ? ageMonths(birth, day) : -1
  const measured = Boolean(birth && day && sex && method && height && weight)
  const result = assess({
    age,
    sex,
    method,
    height: Number(height.replace(',', '.')),
    weight: Number(weight.replace(',', '.')),
  })
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const form = event.currentTarget
    setPending(true)
    setError('')
    try {
      await save('checkup', data)
      form.reset()
      setBirth('')
      setDay(today)
      setSex('')
      setMethod('')
      setWeight('')
      setHeight('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Data belum dapat disimpan.')
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="space-y-6">
      <div>
        <Title>Pemeriksaan Balita</Title>
        <p className="mt-2 text-sm text-muted">
          Catat pengukuran balita dan lihat hasil skrining gizi awal secara otomatis.
        </p>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_19rem]">
        <div className={`${panel} p-5 sm:p-6`}>
          <Title level={2}>Data pemeriksaan</Title>
          <p className="mt-1.5 text-sm text-muted">
            Isi seluruh kolom dan periksa kembali hasil pengukuran.
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Label label="Nama balita">
                <TextInput
                  name="child"
                  placeholder="Contoh: Aisyah Putri"
                  maxLength={100}
                  required
                />
              </Label>
              <Label label="Nama ibu">
                <TextInput name="mother" placeholder="Nama lengkap ibu" maxLength={100} required />
              </Label>
              <Label label="Tanggal lahir">
                <TextInput
                  type="date"
                  name="birth"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  max={day || today}
                  required
                />
              </Label>
              <Label label="Tanggal pemeriksaan">
                <TextInput
                  type="date"
                  name="day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  max={today}
                  required
                />
              </Label>
              <Label label="Jenis kelamin">
                <Select name="sex" value={sex} onChange={(e) => setSex(e.target.value)} required>
                  <option value="">Pilih jenis kelamin</option>
                  <option value="female">Perempuan</option>
                  <option value="male">Laki-laki</option>
                </Select>
              </Label>
              <Label label="Posisi pengukuran">
                <Select
                  name="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                >
                  <option value="">Pilih posisi</option>
                  <option value="length">Telentang (panjang)</option>
                  <option value="height">Berdiri (tinggi)</option>
                </Select>
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-p100 px-4 py-3 text-sm text-p800">
              <CalendarDays size={17} /> Usia saat diperiksa:{' '}
              <strong>{age >= 0 && age < 60 ? `${age} bulan` : '—'}</strong>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label label="Berat badan (kg)">
                <TextInput
                  name="weight"
                  inputMode="decimal"
                  placeholder="Contoh: 12,5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </Label>
              <Label label="Panjang / tinggi badan (cm)">
                <TextInput
                  name="height"
                  inputMode="decimal"
                  placeholder="Contoh: 90,2"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </Label>
            </div>
            <p className="text-xs font-medium text-muted">
              Gunakan koma atau titik untuk angka desimal.
            </p>
            {error && (
              <p role="alert" className="text-sm font-bold text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end border-t border-line pt-4">
              <Button type="submit" disabled={pending}>
                <Check size={17} />
                {pending ? 'Menyimpan…' : 'Simpan Pemeriksaan'}
              </Button>
            </div>
          </form>
        </div>
        <div className={`${panel} p-5 sm:p-6`} aria-live="polite">
          <div className="mb-4 grid size-11 place-items-center rounded-xl bg-p100 text-p600">
            <Activity size={22} />
          </div>
          <Title level={2}>Skrining gizi</Title>
          <p className="mt-2 text-sm text-muted">
            {result
              ? 'Hasil berdasarkan pengukuran:'
              : measured
                ? 'Pengukuran berada di luar rentang kurva. Periksa kembali data dan posisi pengukuran.'
                : 'Hasil akan terlihat setelah tanggal, jenis kelamin, posisi, berat, dan panjang/tinggi diisi.'}
          </p>
          {result && (
            <div
              className={`mt-4 rounded-xl p-4 ${result.nutrition === 'Normal' ? 'bg-g100 text-g500' : 'bg-amber-50 text-amber-900'}`}
            >
              <p className="text-lg font-extrabold">{result.nutrition}</p>
              <p className="mt-1 text-xs font-semibold">Skor Z: {formatted(result.score)} SD</p>
            </div>
          )}
          <div className="mt-5 flex gap-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            <Ruler size={17} className="shrink-0 text-p600" />
            {clinicalNote}
          </div>
        </div>
      </div>
    </section>
  )
}

const reportHeaders = [
  'Nama balita',
  'Nama ibu',
  'Tanggal periksa',
  'Usia (bulan)',
  'Berat (kg)',
  'Panjang/tinggi (cm)',
  'Skrining gizi',
  'Skor Z',
]
const activityHeaders = ['Kegiatan', 'Tanggal', 'Waktu (WIB)', 'Lokasi', 'Status']

export function Reports({
  rows,
  schedules,
  period,
  change,
  today,
  clock,
  demo,
  loading,
}: {
  rows: Checkup[]
  schedules: Schedule[]
  period: string
  change: (value: string) => void
  today: string
  clock: string
  demo: boolean
  loading: boolean
}) {
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')
  const checks = rows.map((row) => [
    row.child,
    row.mother,
    dateLabel(row.day),
    row.age,
    row.weight,
    row.height,
    row.nutrition,
    row.score,
  ])
  const activities = schedules.map((row) => [
    row.title,
    dateLabel(row.day),
    timeLabel(row).replace(' WIB', ''),
    row.location,
    statusFor(row, today, clock),
  ])
  async function download(type: 'pdf' | 'xlsx') {
    setExporting(type)
    setError('')
    const title = `Laporan Posyandu Melati - ${periodLabel(period)}${demo ? ' (Data Contoh)' : ''}`
    const file = `laporan-posyandu-${period}${demo ? '-demo' : ''}.${type}`
    try {
      if (type === 'pdf') {
        const [{ jsPDF }, { autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ])
        const doc = new jsPDF({ orientation: 'landscape' })
        doc.setTextColor('#115E59').setFontSize(18).text(title, 14, 18)
        doc
          .setTextColor('#1F2937')
          .setFontSize(11)
          .text(`Kegiatan: ${activities.length} | Pemeriksaan: ${checks.length}`, 14, 27)
        autoTable(doc, {
          startY: 34,
          head: [activityHeaders],
          body: activities.length ? activities : [['Tidak ada kegiatan']],
          headStyles: { fillColor: '#08776f' },
        })
        const after = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY
        autoTable(doc, {
          startY: after + 10,
          head: [reportHeaders],
          body: checks.length ? checks : [['Tidak ada pemeriksaan']],
          headStyles: { fillColor: '#08776f' },
        })
        const bottom = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY
        if (bottom > 180) doc.addPage()
        doc
          .setFontSize(9)
          .text(doc.splitTextToSize(clinicalNote, 260), 14, bottom > 180 ? 18 : bottom + 9)
        doc.save(file)
      } else {
        const { Workbook } = await import('exceljs')
        const workbook = new Workbook()
        const sheets = [
          ['Kegiatan', activityHeaders, activities],
          ['Pemeriksaan', reportHeaders, checks],
        ] as const
        for (const [name, headers, values] of sheets) {
          const sheet = workbook.addWorksheet(name)
          sheet.addRow([title])
          sheet.addRow([...headers])
          sheet.addRows(values)
          sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } }
          sheet.getRow(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF08776F' },
          }
          for (let col = 1; col <= headers.length; col++)
            sheet.getColumn(col).width = col < 3 ? 28 : 23
        }
        workbook.addWorksheet('Catatan').addRow([clinicalNote])
        const bytes = await workbook.xlsx.writeBuffer()
        const url = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        )
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = file
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch {
      setError('Laporan belum berhasil diekspor. Coba kembali.')
    } finally {
      setExporting('')
    }
  }
  return (
    <section className="space-y-5">
      <div>
        <Title>Laporan Posyandu</Title>
        <p className="mt-2 text-sm text-muted">
          Tinjau kegiatan dan catatan pemeriksaan, lalu unduh laporan bulanan.
        </p>
      </div>
      <div className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <Title level={2}>Periode laporan</Title>
          <p className="mt-1 text-sm text-muted">Pilih bulan dan tahun laporan.</p>
        </div>
        <Period value={period} change={change} />
      </div>
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <Title level={2}>Ringkasan bulanan</Title>
            <p className="mt-1 text-sm text-muted">
              {periodLabel(period)} · {schedules.length} kegiatan · {rows.length} pemeriksaan
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={Boolean(exporting) || loading}
              onClick={() => download('pdf')}
            >
              <Download size={16} />
              {exporting === 'pdf' ? 'Mengekspor…' : 'Ekspor PDF'}
            </Button>
            <Button
              variant="outline"
              disabled={Boolean(exporting) || loading}
              onClick={() => download('xlsx')}
            >
              <FileSpreadsheet size={16} />
              {exporting === 'xlsx' ? 'Mengekspor…' : 'Ekspor Excel'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="w-full text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="border-t border-line px-5 py-3 text-sm font-extrabold">
          Catatan kesehatan balita
        </div>
        {loading ? (
          <p role="status" className="p-10 text-center text-sm text-muted">
            Memuat laporan…
          </p>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-y border-p200 bg-p100 text-xs text-p800">
                <tr>
                  {[
                    'Nama balita',
                    'Tanggal periksa',
                    'Usia',
                    'BB (kg)',
                    'PB/TB (cm)',
                    'Skrining gizi',
                  ].map((col) => (
                    <th scope="col" key={col} className="px-3 py-3 first:pl-5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3.5 pl-5">
                      <p className="font-bold">{row.child}</p>
                      <p className="mt-1 text-xs text-muted">{row.mother}</p>
                    </td>
                    <td className="px-3">{dateLabel(row.day)}</td>
                    <td className="px-3">{row.age} bulan</td>
                    <td className="px-3">{formatted(row.weight)}</td>
                    <td className="px-3">{formatted(row.height)}</td>
                    <td className="px-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.nutrition === 'Normal' ? 'bg-g100 text-g500' : 'bg-amber-50 text-amber-900'}`}
                      >
                        {row.nutrition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={ClipboardList} title="Belum ada catatan pemeriksaan">
            Catatan yang disimpan kader untuk periode ini akan tampil di sini.
          </Empty>
        )}
      </div>
      <Notice>{clinicalNote}</Notice>
    </section>
  )
}
