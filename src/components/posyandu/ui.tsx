import Link from 'next/link'
import { ArrowUpRight, HeartPulse, Info, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

export const panel = 'rounded-2xl border border-line bg-white shadow-panel'
export const field =
  'h-11 w-full min-w-0 rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-p500 focus:ring-2 focus:ring-p200 placeholder:text-slate-400'
export const primary =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-p600 px-4 text-sm font-bold text-white transition hover:bg-g500 disabled:cursor-not-allowed disabled:opacity-50'
export const outline =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-p200 bg-white px-4 text-sm font-bold text-p700 transition hover:bg-p100 disabled:cursor-not-allowed disabled:opacity-50'
export const plain =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-p700 transition hover:bg-p100'
export const iconBtn =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:border-p200 hover:bg-p100 hover:text-p700'

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'outline' | 'plain' | 'icon' }) {
  return (
    <button
      type={type}
      className={`${{ primary, outline, plain, icon: iconBtn }[variant]} ${className}`}
      {...props}
    />
  )
}
export function TextInput({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${field} ${className}`} {...props} />
}
export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${field} pr-7 ${className}`} {...props} />
}
export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${field} min-h-24 py-3 ${className}`} {...props} />
}
export function Label({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`grid content-start gap-2 text-sm font-bold ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}
export function Title({
  children,
  className = '',
  level = 1,
}: {
  children: ReactNode
  className?: string
  level?: 1 | 2 | 3
}) {
  const Tag = ({ 1: 'h1', 2: 'h2', 3: 'h3' } as const)[level]
  return (
    <Tag
      className={`${level === 1 ? 'text-display' : level === 2 ? 'text-xl' : 'text-lg'} font-extrabold leading-tight tracking-tight ${className}`}
    >
      {children}
    </Tag>
  )
}
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3"
      aria-label="SIM-Posyandu, beranda demo"
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-white/15 text-white' : 'bg-p500 text-white shadow-sm'}`}
      >
        <HeartPulse size={22} strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span
          className={`block text-base font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}
        >
          SIM-Posyandu
        </span>
        <span className={`mt-1 block text-xs font-medium ${light ? 'text-p200' : 'text-muted'}`}>
          Desa Sukamaju
        </span>
      </span>
    </Link>
  )
}
export function Notice({
  children,
  icon: Icon = Info,
}: {
  children: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-p200 bg-p100 px-4 py-3.5 text-sm leading-relaxed text-p800">
      <Icon size={19} className="mt-0.5 shrink-0 text-p600" />
      <div>{children}</div>
    </div>
  )
}
export function Empty({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-14 text-center">
      <span className="mb-2 grid size-12 place-items-center rounded-xl bg-p100 text-p600">
        <Icon size={22} />
      </span>
      <Title level={3}>{title}</Title>
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  )
}
export function BannerArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 392 207" fill="none" className={className} aria-hidden="true">
      <circle cx="271" cy="103" r="143" stroke="white" strokeOpacity=".08" strokeWidth="1.3" />
      <circle cx="271" cy="103" r="116" stroke="white" strokeOpacity=".12" strokeWidth="1.3" />
      <circle
        cx="271"
        cy="103"
        r="89"
        fill="white"
        fillOpacity=".065"
        stroke="white"
        strokeOpacity=".09"
      />
      <path
        d="M91 61h19m-9.5-9.5v19M338 42h13m-6.5-6.5v13M148 159h14m-7-7v14M363 148h17m-8.5-8.5v17"
        stroke="#99F6E4"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity=".53"
      />
      <circle cx="129" cy="103" r="3" fill="#99F6E4" opacity=".75" />
      <circle cx="309" cy="178" r="3" fill="#99F6E4" opacity=".65" />
      <circle cx="317" cy="25" r="2.5" fill="#99F6E4" opacity=".5" />
      <circle cx="364" cy="91" r="2" fill="#99F6E4" opacity=".6" />
      <g transform="rotate(-10 236 102)">
        <rect
          x="183"
          y="52"
          width="120"
          height="112"
          rx="17"
          fill="#053e3a"
          opacity=".28"
          transform="translate(4 8)"
        />
        <rect x="183" y="52" width="120" height="112" rx="17" fill="#e5fbf5" />
        <path d="M183 69c0-9.4 7.6-17 17-17h86c9.4 0 17 7.6 17 17v14H183V69Z" fill="#8ae3d3" />
        <path d="M211 45v19m63-19v19" stroke="#d3fff3" strokeWidth="7" strokeLinecap="round" />
        <g fill="#a9e3da">
          <rect x="202" y="98" width="14" height="12" rx="3" />
          <rect x="225" y="98" width="14" height="12" rx="3" />
          <rect x="248" y="98" width="14" height="12" rx="3" />
          <rect x="271" y="98" width="14" height="12" rx="3" />
          <rect x="202" y="119" width="14" height="12" rx="3" />
          <rect x="248" y="119" width="14" height="12" rx="3" />
          <rect x="271" y="119" width="14" height="12" rx="3" />
          <rect x="202" y="140" width="14" height="9" rx="3" />
          <rect x="225" y="140" width="14" height="9" rx="3" />
          <rect x="248" y="140" width="14" height="9" rx="3" />
        </g>
        <rect x="225" y="119" width="14" height="12" rx="3" fill="#138d80" />
      </g>
      <circle cx="305" cy="132" r="30" fill="#064941" opacity=".2" transform="translate(4 5)" />
      <circle cx="305" cy="132" r="29" fill="#aaf3df" stroke="#ccfbf1" strokeWidth="2" />
      <path
        d="M305 143c-6-4-13-8-13-14a7.2 7.2 0 0 1 13-4.5 7.2 7.2 0 0 1 13 4.5c0 6-7 10-13 14Z"
        fill="#128477"
      />
      <path
        d="M296 132h5l2-4 3.5 8 2-4h5.5"
        stroke="#d5fff5"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
export function DemoLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-p700 hover:underline"
    >
      Lihat demo <ArrowUpRight size={15} />
    </Link>
  )
}
