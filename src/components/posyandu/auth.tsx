'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { BannerArt, Brand, Button, Label, TextInput, Title, plain } from './ui'
import { post } from './requests'

export function AuthScreen({ signup = false }: { signup?: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [show, setShow] = useState(false)
  useEffect(() => {
    setRegistered(new URLSearchParams(window.location.search).get('terdaftar') === '1')
  }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    setPending(true)
    setError('')
    try {
      await post(signup ? 'signup' : 'login', data)
      window.location.assign(signup ? '/masuk?terdaftar=1' : '/dasbor')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi masalah. Silakan coba kembali.')
      setPending(false)
    }
  }
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative isolate hidden flex-col overflow-hidden bg-linear-to-br from-p900 via-p700 to-p500 px-12 py-10 text-white lg:flex xl:px-17">
        <Brand light />
        <div className="relative z-10 mt-auto max-w-md pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-p100">
            <HeartPulse size={15} /> Posyandu Melati
          </span>
          <Title level={2} className="mt-5 text-hero!">
            Layanan Posyandu, lebih dekat dengan keluarga.
          </Title>
          <p className="mt-4 max-w-sm text-sm leading-7 text-p100/90">
            Temukan jadwal kegiatan, catat pelayanan ibu dan anak, dan terhubung dengan kader Desa
            Sukamaju.
          </p>
        </div>
        <div className="relative mt-auto min-h-44">
          <BannerArt className="absolute right-0 -bottom-15 h-64 w-auto xl:h-75" />
          <p className="absolute bottom-0 left-0 text-xs text-p200">SIM-Posyandu · Desa Sukamaju</p>
        </div>
      </section>
      <section className="flex flex-col px-5 py-5 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between gap-2">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link href="/" className={`${plain} ml-auto`}>
            <ArrowLeft size={17} /> Kembali ke demo
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-p600 uppercase">
            {signup ? 'Registrasi warga' : 'Selamat datang'}
          </p>
          <Title>{signup ? 'Buat akun warga' : 'Masuk ke akun Anda'}</Title>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {signup
              ? 'Daftarkan akun untuk melihat jadwal, mengelola data diri, dan menyampaikan keluhan.'
              : 'Gunakan email dan kata sandi yang terdaftar untuk membuka dasbor.'}
          </p>
          {registered && !signup && (
            <p
              role="status"
              className="mt-4 flex gap-2 rounded-lg bg-g100 p-3 text-sm font-bold text-g500"
            >
              <CheckCircle2 size={18} /> Akun berhasil dibuat. Silakan masuk.
            </p>
          )}
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {signup && (
              <Label label="Nama lengkap">
                <TextInput
                  autoComplete="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Masukkan nama lengkap"
                />
              </Label>
            )}
            <Label label="Alamat email">
              <TextInput
                type="email"
                autoComplete="username"
                name="email"
                required
                maxLength={254}
                placeholder="nama@contoh.com"
              />
            </Label>
            <div className="relative">
              <Label label="Kata sandi">
                <TextInput
                  className="pr-12"
                  name="password"
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  type={show ? 'text' : 'password'}
                  required
                  minLength={signup ? 8 : undefined}
                  maxLength={128}
                  placeholder={signup ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                />
              </Label>
              <Button
                variant="plain"
                className="absolute right-1 bottom-1 h-9 px-2.5"
                aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            {signup && (
              <Label label="Konfirmasi kata sandi">
                <TextInput
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  name="confirm"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="Ulangi kata sandi"
                />
              </Label>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="mt-1 min-h-12 w-full" disabled={pending}>
              {pending ? 'Memproses…' : signup ? 'Buat akun' : 'Masuk'}
              {!pending && <ArrowRight size={17} />}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            {signup ? 'Sudah punya akun?' : 'Belum punya akun warga?'}{' '}
            <Link
              href={signup ? '/masuk' : '/daftar'}
              className="font-extrabold text-p700 hover:underline"
            >
              {signup ? 'Masuk' : 'Daftar di sini'}
            </Link>
          </p>
          <div className="mt-7 flex gap-2 rounded-xl border border-line bg-canvas p-3.5 text-xs leading-relaxed text-muted">
            <ShieldCheck size={17} className="shrink-0 text-p600" />
            <span>
              <strong className="text-ink">Untuk kader:</strong> akun dibuat oleh pengelola pusat.
              Tidak perlu mendaftar.
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
