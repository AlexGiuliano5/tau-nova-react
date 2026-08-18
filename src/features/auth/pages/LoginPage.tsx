import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-(--primary-3) px-5 py-8 dark:bg-(--secondary-2)">
      <section className="w-full max-w-sm rounded-2xl border border-(--outline) bg-(--card) p-6 shadow-lg">
        <header className="mb-5 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-(--text-primary)">Ingresar</h1>
          <p className="text-sm text-(--text-secondary)">Usuario y contraseña</p>
        </header>
        <LoginForm />
      </section>
    </main>
  )
}
