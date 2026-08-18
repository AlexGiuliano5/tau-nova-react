import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authenticate } from '@/features/auth/api/authenticate'
import { resolveAuthenticatedHomePath } from '@/features/auth/lib/post-login'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function LoginForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const disabledByFields = username.trim().length === 0 || password.trim().length === 0
  const isDisabled = disabledByFields || pending || isRedirecting

  const onUsernameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    passwordInputRef.current?.focus()
  }

  const onPasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isDisabled) return

    setPending(true)
    setError(null)

    const result = await authenticate({
      username: username.trim(),
      password: password.trim(),
    })

    setPending(false)

    if (!result.ok || !result.token) {
      setError(result.message ?? 'No fue posible iniciar sesión.')
      return
    }

    setSession(result.token)
    setIsRedirecting(true)
    void navigate(resolveAuthenticatedHomePath(result.token), { replace: true })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm text-(--text-secondary)">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          enterKeyHint="next"
          placeholder="Ingresá tu usuario"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onKeyDown={onUsernameKeyDown}
          className="h-11 rounded-lg border border-(--outline) bg-(--card) px-3 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--primary)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-(--text-secondary)">
          Contraseña
        </label>
        <input
          id="password"
          ref={passwordInputRef}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          enterKeyHint="go"
          placeholder="Ingresá tu contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={onPasswordKeyDown}
          className="h-11 rounded-lg border border-(--outline) bg-(--card) px-3 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--primary)"
        />
      </div>

      {error ? <p className="text-sm text-(--state-03)">{error}</p> : null}

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-1 h-11 rounded-lg bg-(--primary-2) font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-(--secondary-3)"
      >
        {isRedirecting ? 'Redirigiendo...' : pending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
