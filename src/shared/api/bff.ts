import {
  BFF_API_BASE_URL,
  NOVA_FACADE_API_BASE_URL,
  NOVA_FACADE_DEV_PROXY_PATH,
} from '@/config'

export function getBffBaseUrl(): string {
  return BFF_API_BASE_URL.replace(/\/+$/, '')
}

export function getNovaFacadeBaseUrl(): string {
  if (shouldUseNovaFacadeDevProxy()) {
    return NOVA_FACADE_DEV_PROXY_PATH
  }
  return NOVA_FACADE_API_BASE_URL.replace(/\/+$/, '')
}

function shouldUseNovaFacadeDevProxy(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  const { hostname } = window.location
  return hostname === 'localhost' || hostname === '127.0.0.1'
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
