import { getBffBaseUrl } from '@/shared/api/bff'
import { useAuthStore } from '@/features/auth/store/auth-store'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiFetchInit = RequestInit & {
  /** Si false, no adjunta Bearer (login). Default true. */
  auth?: boolean
}

/**
 * Fetch browser → BFF con Bearer del auth store.
 * Ante 401 limpia sesión y manda a /login.
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { auth = true, headers: initHeaders, ...rest } = init
  const token = useAuthStore.getState().token

  const headers = new Headers(initHeaders)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = path.startsWith('http') ? path : `${getBffBaseUrl()}${path}`
  const response = await fetch(url, { ...rest, headers })

  if (auth && (response.status === 401 || response.status === 403)) {
    const onLogin = window.location.pathname === '/login'
    useAuthStore.getState().logout()
    if (!onLogin) {
      window.location.assign('/login')
    }
  }

  return response
}
