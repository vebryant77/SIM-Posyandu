import 'server-only'

import { cookies } from 'next/headers'
import { createPayloadRequest, JWTAuthentication, logoutOperation } from 'payload'
import { getPayloadClient } from './payload'

const session = 'app-session'

export function createAppAuth(collection: 'users') {
  async function user() {
    const token = (await cookies()).get(session)?.value
    if (!token) return null
    const payload = await getPayloadClient()
    const headers = new Headers({ Authorization: `JWT ${token}`, DisableAutologin: 'true' })
    // Make's configured auth strategies only cover the CMS identity. Use Payload's
    // native JWT strategy for the isolated app cookie without changing CMS auth.
    const req = await createPayloadRequest({ payload, req: { headers } })
    const { user } = await JWTAuthentication({ headers, payload, req, strategyName: 'local-jwt' })
    return user?.collection === collection ? user : null
  }

  const cookieOptions = (request: Request) => {
    const secure =
      request.headers.get('x-forwarded-proto') === 'https' ||
      new URL(request.url).protocol === 'https:' ||
      Boolean(process.env.FIGMA_PUBLIC_URL)
    const embedded = Boolean(process.env.FIGMA_PUBLIC_URL) && secure
    return {
      httpOnly: true,
      secure,
      sameSite: embedded ? ('none' as const) : ('lax' as const),
      partitioned: embedded,
      path: '/',
    }
  }

  return {
    user,
    async login(email: string, password: string, request: Request) {
      const payload = await getPayloadClient()
      const { token, exp } = await payload.login({
        collection,
        data: { email, password },
        overrideAccess: false,
        depth: 0,
      })
      if (!token || !exp) return false
      ;(await cookies()).set(session, token, {
        ...cookieOptions(request),
        expires: new Date(exp * 1000),
      })
      return true
    },
    async logout(request: Request) {
      try {
        const current = await user()
        if (current) {
          const payload = await getPayloadClient()
          const req = await createPayloadRequest({ user: current, payload })
          await logoutOperation({ collection: payload.collections[collection], req })
        }
      } finally {
        ;(await cookies()).set(session, '', { ...cookieOptions(request), maxAge: 0 })
      }
    },
  }
}

export const appAuth = createAppAuth('users')
