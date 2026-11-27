'use client'

import { useState } from 'react'
import { Brand, Button, Title, panel } from '@/components/posyandu/ui'
import { post } from '@/components/posyandu/requests'

export default function DashboardError({ reset }: { reset: () => void }) {
  const [message, setMessage] = useState('')
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <div className={`${panel} w-full max-w-lg space-y-5 p-7`}>
        <Brand />
        <Title level={2}>Dasbor belum dapat dibuka</Title>
        <p className="text-sm text-muted">
          Coba muat ulang. Jika masalah berlanjut, keluar lalu masuk kembali.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset}>Coba lagi</Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await post('logout')
                window.location.assign('/masuk')
              } catch {
                setMessage('Belum dapat keluar. Silakan coba kembali.')
              }
            }}
          >
            Keluar
          </Button>
        </div>
        {message && (
          <p role="alert" className="text-sm text-red-700">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
