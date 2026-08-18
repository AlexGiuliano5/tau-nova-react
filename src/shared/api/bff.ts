import { BFF_API_BASE_URL } from '@/config'

export function getBffBaseUrl(): string {
  return BFF_API_BASE_URL.replace(/\/+$/, '')
}

export async function parseJsonResponse(response: Response): Promise<unknown> {
  const rawBody = await response.text()
  if (!rawBody) {
    return null
  }

  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    return null
  }
}
