import { APIError, type Access, type CollectionConfig } from 'payload'
import { InputError, text } from '@/lib/posyandu'

export const central: Access = ({ req }) => req.user?.collection === 'admins'
export const isKader: Access = ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'kader'
const selfOrCentral: Access = ({ req }) =>
  req.user?.collection === 'admins' ||
  (req.user?.collection === 'users' ? { id: { equals: req.user.id } } : false)

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Akun Posyandu', plural: 'Akun Posyandu' },
  admin: { useAsTitle: 'name', group: 'Posyandu', defaultColumns: ['name', 'email', 'role'] },
  auth: { tokenExpiration: 60 * 60 * 12, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  access: {
    admin: () => false,
    create: ({ req }) => !req.user || req.user.collection === 'admins',
    read: selfOrCentral,
    update: selfOrCentral,
    delete: central,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation, originalDoc }) => {
        if (!data) return data
        try {
          const normalized = { ...data }
          if (operation === 'create' || data.name !== undefined)
            normalized.name = text(data, 'name', 100, 'nama', 2)
          if (operation === 'create') {
            if (req.user?.collection !== 'admins') normalized.role = 'warga'
            if (
              typeof data.password !== 'string' ||
              data.password.length < 8 ||
              data.password.length > 128
            )
              throw new InputError('Kata sandi harus terdiri dari 8–128 karakter.')
          } else if (
            req.user?.collection === 'users' &&
            data.email !== undefined &&
            data.email !== originalDoc?.email
          ) {
            throw new InputError('Alamat email tidak dapat diubah di dasbor.')
          }
          for (const [key, limit] of [
            ['phone', 24],
            ['address', 300],
          ] as const) {
            if (data[key] !== undefined)
              normalized[key] = text(
                data,
                key,
                limit,
                key === 'phone' ? 'nomor telepon' : 'alamat',
                0,
              )
          }
          return normalized
        } catch (error) {
          if (error instanceof InputError) throw new APIError(error.message, 400)
          throw error
        }
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Nama lengkap', type: 'text', required: true, maxLength: 100 },
    {
      name: 'role',
      label: 'Peran',
      type: 'select',
      required: true,
      defaultValue: 'warga',
      saveToJWT: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
      options: [
        { label: 'Warga', value: 'warga' },
        { label: 'Kader', value: 'kader' },
      ],
    },
    { name: 'phone', label: 'Nomor telepon', type: 'text', maxLength: 24 },
    { name: 'address', label: 'Alamat', type: 'textarea', maxLength: 300 },
  ],
}
