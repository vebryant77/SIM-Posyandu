export async function post(action: string, data: Record<string, unknown> = {}) {
  const response = await fetch('/api/posyandu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, action }),
  })
  if (!response.ok) {
    const message = await response.json().then(
      (result) => result.error,
      () => null,
    )
    throw new Error(message ?? 'Terjadi masalah. Silakan coba kembali.')
  }
}
