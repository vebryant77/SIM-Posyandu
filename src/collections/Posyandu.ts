import {
  APIError,
  type Access,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'
import { checkupInput, InputError, scheduleInput, statuses, text, todayWib } from '@/lib/posyandu'
import { isKader } from './Users'

const appUser: Access = ({ req }) => req.user?.collection === 'users'
const staff: Access = (args) => args.req.user?.collection === 'admins' || isKader(args)
const no = () => false
const normalize =
  (parse: (data: Record<string, unknown>) => object): CollectionBeforeValidateHook =>
  ({ data, originalDoc }) => {
    try {
      return { ...data, ...parse({ ...originalDoc, ...data }) }
    } catch (error) {
      if (error instanceof InputError) throw new APIError(error.message, 400)
      throw error
    }
  }

export const Schedules: CollectionConfig = {
  slug: 'schedules',
  labels: { singular: 'Jadwal', plural: 'Jadwal' },
  admin: { useAsTitle: 'title', group: 'Posyandu', defaultColumns: ['title', 'day', 'location'] },
  access: {
    create: staff,
    update: staff,
    read: (args) => args.req.user?.collection === 'admins' || appUser(args),
    delete: no,
  },
  hooks: { beforeValidate: [normalize(scheduleInput)] },
  fields: [
    { name: 'title', label: 'Nama kegiatan', type: 'text', required: true, maxLength: 140 },
    {
      name: 'day',
      label: 'Tanggal',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'start', label: 'Mulai (WIB)', type: 'text', required: true, maxLength: 5 },
    { name: 'end', label: 'Selesai (WIB)', type: 'text', required: true, maxLength: 5 },
    { name: 'location', label: 'Lokasi', type: 'text', required: true, maxLength: 180 },
    { name: 'notes', label: 'Keterangan', type: 'textarea', maxLength: 500 },
  ],
}

export const Checkups: CollectionConfig = {
  slug: 'checkups',
  labels: { singular: 'Pemeriksaan Balita', plural: 'Pemeriksaan Balita' },
  admin: { useAsTitle: 'child', group: 'Posyandu', defaultColumns: ['child', 'day', 'nutrition'] },
  access: { read: staff, create: staff, update: no, delete: no },
  hooks: {
    beforeValidate: [
      normalize((data) => {
        const {
          age: _age,
          nutrition: _nutrition,
          score: _score,
          ...measurement
        } = checkupInput(data, todayWib())
        return measurement
      }),
    ],
    beforeChange: [({ data }) => ({ ...data, ...checkupInput(data, todayWib()) })],
  },
  fields: [
    { name: 'child', label: 'Nama balita', type: 'text', required: true, maxLength: 100 },
    { name: 'mother', label: 'Nama ibu', type: 'text', required: true, maxLength: 100 },
    {
      name: 'birth',
      label: 'Tanggal lahir',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'day',
      label: 'Tanggal periksa',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'sex',
      label: 'Jenis kelamin',
      type: 'select',
      required: true,
      options: [
        { label: 'Laki-laki', value: 'male' },
        { label: 'Perempuan', value: 'female' },
      ],
    },
    {
      name: 'method',
      label: 'Posisi pengukuran',
      type: 'select',
      required: true,
      options: [
        { label: 'Telentang', value: 'length' },
        { label: 'Berdiri', value: 'height' },
      ],
    },
    { name: 'weight', label: 'Berat (kg)', type: 'number', required: true },
    { name: 'height', label: 'Panjang/tinggi (cm)', type: 'number', required: true },
    {
      name: 'age',
      label: 'Usia (bulan)',
      type: 'number',
      access: { create: no, update: no },
      admin: { readOnly: true },
    },
    {
      name: 'nutrition',
      label: 'Hasil skrining BB/PB atau BB/TB',
      type: 'select',
      options: [...statuses],
      access: { create: no, update: no },
      admin: { readOnly: true },
    },
    {
      name: 'score',
      label: 'Skor Z',
      type: 'number',
      access: { create: no, update: no },
      admin: { readOnly: true },
    },
  ],
}

export const Complaints: CollectionConfig = {
  slug: 'complaints',
  labels: { singular: 'Keluhan', plural: 'Keluhan' },
  admin: {
    useAsTitle: 'title',
    group: 'Posyandu',
    defaultColumns: ['title', 'owner', 'createdAt'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users' && req.user.role === 'warga',
    read: (args) =>
      staff(args) ||
      (args.req.user?.collection === 'users' ? { owner: { equals: args.req.user.id } } : false),
    update: no,
    delete: no,
  },
  hooks: {
    beforeValidate: [
      normalize((data) => ({
        title: text(data, 'title', 100, 'judul'),
        message: text(data, 'message', 1500, 'keluhan', 5),
      })),
    ],
    beforeChange: [({ data, req }) => ({ ...data, owner: req.user?.id })],
  },
  fields: [
    { name: 'title', label: 'Judul', type: 'text', required: true, maxLength: 100 },
    { name: 'message', label: 'Keluhan', type: 'textarea', required: true, maxLength: 1500 },
    {
      name: 'owner',
      label: 'Pengirim',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { create: no, update: no },
      admin: { readOnly: true },
    },
  ],
}
