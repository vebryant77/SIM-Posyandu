import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import {
  checkupInput,
  dateOnly,
  InputError,
  monthRange,
  scheduleInput,
  text,
  todayWib,
  validPeriod,
  type DashboardData,
  type Profile,
} from '@/lib/posyandu'

const send = (data: object, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
const reject = (error: string, status = 400) => send({ error }, status)

export async function GET(request: Request) {
  try {
    const user = await appAuth.user()
    if (!user) return reject('Sesi berakhir. Silakan masuk kembali.', 401)
    const period = new URL(request.url).searchParams.get('period') ?? todayWib().slice(0, 7)
    if (!validPeriod(period)) return reject('Periode tidak valid.')
    const payload = await getPayloadClient()
    const auth = { user, overrideAccess: false, depth: 0 } as const
    const where = { day: monthRange(period) }
    const kader = user.role === 'kader'
    const [schedules, notifications, checkups, complaints] = await Promise.all([
      payload.find({
        collection: 'schedules',
        ...auth,
        where,
        sort: ['day', 'start'],
        pagination: false,
      }),
      kader
        ? null
        : payload.find({ collection: 'schedules', ...auth, sort: '-createdAt', limit: 20 }),
      kader
        ? payload.find({ collection: 'checkups', ...auth, where, sort: '-day', pagination: false })
        : null,
      payload.find({ collection: 'complaints', ...auth, sort: '-createdAt', limit: 50 }),
    ])
    const scheduleVM = ({
      id,
      title,
      day,
      start,
      end,
      location,
      notes,
      createdAt,
    }: (typeof schedules.docs)[number]) => ({
      id,
      title,
      day: dateOnly(day),
      start,
      end,
      location,
      notes,
      createdAt,
    })
    const data: DashboardData = {
      schedules: schedules.docs.map(scheduleVM),
      notifications: notifications?.docs.map(scheduleVM) ?? [],
      checkups:
        checkups?.docs.flatMap(
          ({
            id,
            child,
            mother,
            birth,
            day,
            sex,
            method,
            height,
            weight,
            age,
            nutrition,
            score,
          }) =>
            age == null || nutrition == null || score == null
              ? []
              : [
                  {
                    id,
                    child,
                    mother,
                    birth: dateOnly(birth),
                    day: dateOnly(day),
                    sex,
                    method,
                    height,
                    weight,
                    age,
                    nutrition,
                    score,
                  },
                ],
        ) ?? [],
      complaints: complaints.docs.map(({ id, title, message, createdAt }) => ({
        id,
        title,
        message,
        createdAt,
      })),
    }
    const profile: Profile = {
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      phone: user.phone,
    }
    return send({ data, profile })
  } catch {
    return reject('Data belum dapat dimuat. Silakan coba kembali.', 503)
  }
}

export async function POST(request: Request) {
  if (
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    !request.headers.get('content-type')?.startsWith('application/json')
  ) {
    return reject('Permintaan tidak valid.', 403)
  }
  try {
    const data = (await request.json()) as Record<string, unknown> | null
    if (!data || Array.isArray(data) || typeof data !== 'object')
      return reject('Permintaan tidak valid.')
    if (data.action === 'logout') {
      await appAuth.logout(request)
      return send({ ok: true })
    }
    const payload = await getPayloadClient()
    if (data.action === 'login' || data.action === 'signup') {
      const email = text(data, 'email', 254, 'email').toLowerCase()
      const password = data.password
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' ||
        !password.length ||
        password.length > 128
      ) {
        return reject('Periksa alamat email dan kata sandi.')
      }
      if (data.action === 'signup') {
        const name = text(data, 'name', 100, 'nama lengkap', 2)
        if (password.length < 8) return reject('Gunakan minimal 8 karakter untuk kata sandi.')
        if (password !== data.confirm) return reject('Konfirmasi kata sandi belum sama.')
        try {
          await payload.create({
            collection: 'users',
            overrideAccess: false,
            data: { name, email, password, role: 'warga' },
            depth: 0,
          })
        } catch {
          return reject(
            'Akun tidak dapat dibuat. Periksa data atau coba masuk jika sudah terdaftar.',
            400,
          )
        }
        return send({ ok: true }, 201)
      }
      try {
        if (await appAuth.login(email, password, request)) return send({ ok: true })
      } catch {
        // Return the same response for wrong credentials, missing accounts, and locked accounts.
      }
      return reject('Email atau kata sandi tidak cocok, atau akun sedang terkunci sementara.', 401)
    }
    const user = await appAuth.user()
    if (!user) return reject('Sesi berakhir. Silakan masuk kembali.', 401)
    const auth = { user, overrideAccess: false, depth: 0 } as const
    if (data.action === 'schedule' && user.role === 'kader') {
      const fields = scheduleInput(data)
      if (typeof data.id === 'string' || typeof data.id === 'number') {
        if (String(data.id).length > 100) return reject('Jadwal tidak valid.')
        await payload.update({ collection: 'schedules', id: data.id, data: fields, ...auth })
      } else {
        await payload.create({ collection: 'schedules', data: fields, ...auth })
      }
      return send({ ok: true })
    }
    if (data.action === 'checkup' && user.role === 'kader') {
      const {
        age: _age,
        score: _score,
        nutrition: _nutrition,
        ...fields
      } = checkupInput(data, todayWib())
      await payload.create({ collection: 'checkups', data: fields, ...auth })
      return send({ ok: true }, 201)
    }
    if (data.action === 'complaint' && user.role === 'warga') {
      const title = text(data, 'title', 100, 'judul')
      const message = text(data, 'message', 1500, 'keluhan', 5)
      await payload.create({ collection: 'complaints', data: { title, message }, ...auth })
      return send({ ok: true }, 201)
    }
    if (data.action === 'profile' && user.role === 'warga') {
      const name = text(data, 'name', 100, 'nama lengkap', 2)
      const phone = text(data, 'phone', 24, 'nomor telepon', 0)
      const address = text(data, 'address', 300, 'alamat', 0)
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { name, phone, address },
        ...auth,
      })
      return send({ ok: true })
    }
    return reject('Anda tidak memiliki akses untuk tindakan ini.', 403)
  } catch (error) {
    return error instanceof InputError
      ? reject(error.message)
      : reject('Perubahan belum dapat disimpan. Silakan coba kembali.', 503)
  }
}
