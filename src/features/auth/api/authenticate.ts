import { encodePasswordBase64 } from '@/features/auth/lib/password-encoding'
import { getBffBaseUrl, parseJsonResponse } from '@/shared/api/bff'

interface AuthenticateInput {
  username: string
  password: string
}

export interface AuthenticateResult {
  ok: boolean
  token?: string
  message?: string
}

export async function authenticate({
  username,
  password,
}: AuthenticateInput): Promise<AuthenticateResult> {
  const encodedPassword = encodePasswordBase64(password)
  const url = `${getBffBaseUrl()}/api/v1/authenticate`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: username,
        password: encodedPassword,
      }),
    })

    const data = (await parseJsonResponse(response)) as { token?: string } | null
    const token =
      data && typeof data.token === 'string' && data.token.length > 0 ? data.token : undefined

    if (response.status === 202) {
      return {
        ok: false,
        message: 'No fue posible iniciar sesión. Verificá los datos e intentá nuevamente.',
      }
    }

    if (token) {
      return { ok: true, token }
    }

    return { ok: false, message: 'No fue posible iniciar sesión.' }
  } catch {
    return {
      ok: false,
      message: 'No se pudo conectar con el servicio de autenticación.',
    }
  }
}
