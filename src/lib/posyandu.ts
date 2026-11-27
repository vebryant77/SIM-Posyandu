import who from './who-bb.json'

export const months = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]
export const statuses = [
  'Gizi buruk',
  'Gizi kurang',
  'Normal',
  'Berisiko gizi lebih',
  'Gizi lebih',
  'Obesitas',
] as const
export type Nutrition = (typeof statuses)[number]
export type Role = 'kader' | 'warga'
export type ID = string | number
export type Profile = {
  name: string
  email: string
  role: Role
  phone?: string | null
  address?: string | null
}
export type ScheduleInput = {
  title: string
  day: string
  start: string
  end: string
  location: string
  notes: string
}
export type Schedule = Omit<ScheduleInput, 'notes'> & {
  notes?: string | null
  id: ID
  createdAt: string
}
export type CheckupInput = {
  child: string
  mother: string
  birth: string
  day: string
  sex: 'male' | 'female'
  method: 'length' | 'height'
  weight: number
  height: number
}
export type Checkup = CheckupInput & { id: ID; age: number; nutrition: Nutrition; score: number }
export type Complaint = {
  id: ID
  title: string
  message: string
  createdAt: string
  author?: string
}
export type DashboardData = {
  schedules: Schedule[]
  notifications: Schedule[]
  checkups: Checkup[]
  complaints: Complaint[]
}

export const todayWib = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
export const dateOnly = (value: string) => value.slice(0, 10)
export const validDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
export const validPeriod = (value: string) => /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)
export const periodLabel = (value: string) =>
  `${months[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`
export const dateLabel = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('id-ID', {
    ...(options ?? { day: 'numeric', month: 'short', year: 'numeric' }),
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
export function monthRange(period: string) {
  const [year, month] = period.split('-').map(Number)
  return {
    greater_than_equal: `${period}-01T00:00:00.000Z`,
    less_than: new Date(Date.UTC(year, month, 1)).toISOString(),
  }
}
export const scheduleDone = (row: ScheduleInput | Schedule, today: string, clock = '00:00') =>
  row.day < today || (row.day === today && row.end <= clock)

export function ageMonths(birth: string, day: string) {
  const [by, bm, bd] = birth.split('-').map(Number)
  const [dy, dm, dd] = day.split('-').map(Number)
  return (dy - by) * 12 + dm - bm - Number(dd < bd)
}

// WHO Child Growth Standards, weight-for-length/height z-score XLSX tables
// (https://www.who.int/tools/child-growth-standards/standards/weight-for-length-height).
// Interpolate LMS at the measured value; apply the WHO posture correction of 0.7 cm.
export function assess(input: {
  age: number
  sex: string
  method: string
  height: number
  weight: number
}) {
  const { age, sex, method, weight } = input
  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age >= 60 ||
    !['male', 'female'].includes(sex) ||
    !['length', 'height'].includes(method) ||
    !(weight >= 0.5 && weight <= 50)
  )
    return null
  const length = age < 24
  const height =
    Math.round(
      (input.height +
        (length && method === 'height' ? 0.7 : !length && method === 'length' ? -0.7 : 0)) *
        10,
    ) / 10
  const table = who[`${length ? 'wfl' : 'wfh'}_${sex === 'male' ? 'boys' : 'girls'}`]
  const index = (height - table.start) * 2
  if (!(index >= 0 && index <= table.ms.length - 1)) return null
  const lower = table.ms[Math.floor(index)]
  const upper = table.ms[Math.ceil(index)]
  const fraction = index - Math.floor(index)
  const [m, s] = lower.map((v, i) => v + (upper[i] - v) * fraction)
  const l = table.lambda
  const raw = ((weight / m) ** l - 1) / (l * s)
  const atZ = (z: number) => m * (1 + l * s * z) ** (1 / l)
  const z =
    raw < -3
      ? -3 + (weight - atZ(-3)) / (atZ(-2) - atZ(-3))
      : raw > 3
        ? 3 + (weight - atZ(3)) / (atZ(3) - atZ(2))
        : raw
  const nutrition = statuses[z < -3 ? 0 : z < -2 ? 1 : z <= 1 ? 2 : z <= 2 ? 3 : z <= 3 ? 4 : 5]
  return { age, nutrition, score: Math.round(z * 100) / 100 }
}

export class InputError extends Error {}
type Fields = Record<string, unknown>
export function text(data: Fields, key: string, max: number, label: string, min = 1) {
  const value = typeof data[key] === 'string' ? data[key].trim() : ''
  if (value.length < min || value.length > max)
    throw new InputError(`Periksa kembali kolom ${label}.`)
  return value
}
function dayValue(data: Fields, key: string, label: string) {
  const raw = text(data, key, 30, label)
  const value = dateOnly(raw)
  if (!validDay(value) || (raw !== value && raw !== `${value}T00:00:00.000Z`))
    throw new InputError(`Tanggal ${label} tidak valid.`)
  return value
}
const decimal = (value: unknown) =>
  typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+(?:[.,]\d+)?$/.test(value.trim())
      ? Number(value.trim().replace(',', '.'))
      : NaN

export function scheduleInput(data: Fields): ScheduleInput {
  const start = text(data, 'start', 5, 'waktu mulai')
  const end = text(data, 'end', 5, 'waktu selesai')
  const clock = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (!clock.test(start) || !clock.test(end) || end <= start)
    throw new InputError('Waktu selesai harus setelah waktu mulai (WIB).')
  return {
    start,
    end,
    day: dayValue(data, 'day', 'kegiatan'),
    title: text(data, 'title', 140, 'nama kegiatan'),
    location: text(data, 'location', 180, 'lokasi'),
    notes: text(data, 'notes', 500, 'keterangan', 0),
  }
}

export function checkupInput(data: Fields, today: string) {
  const birth = dayValue(data, 'birth', 'lahir')
  const day = dayValue(data, 'day', 'pemeriksaan')
  const age = ageMonths(birth, day)
  if (birth > day || day > today || age < 0 || age >= 60)
    throw new InputError(
      'Periksa tanggal: usia harus 0–59 bulan dan tanggal pemeriksaan tidak boleh di masa depan.',
    )
  const sex = data.sex
  const method = data.method
  if ((sex !== 'male' && sex !== 'female') || (method !== 'length' && method !== 'height'))
    throw new InputError('Pilih jenis kelamin dan posisi pengukuran.')
  const weight = decimal(data.weight)
  const height = decimal(data.height)
  if (!(height >= 40 && height <= 125) || !(weight >= 0.5 && weight <= 50))
    throw new InputError(
      'Masukkan berat badan (0,5–50 kg) dan panjang/tinggi badan (40–125 cm) yang valid.',
    )
  const result = assess({ age, sex, method, weight, height })
  if (!result)
    throw new InputError(
      'Panjang/tinggi di luar rentang kurva WHO untuk pengukuran ini. Periksa posisi dan angka pengukuran.',
    )
  return {
    child: text(data, 'child', 100, 'nama balita'),
    mother: text(data, 'mother', 100, 'nama ibu'),
    birth,
    day,
    sex,
    method,
    weight,
    height,
    ...result,
  } satisfies Omit<Checkup, 'id'>
}
