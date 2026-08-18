import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'Esta pantalla se migrará en una próxima iteración.',
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-(--text-primary)">{title}</h1>
      <p className="max-w-md text-sm text-(--text-secondary)">{description}</p>
      <Link
        to="/ftth"
        className="mt-2 text-sm font-semibold text-(--primary-2) hover:underline dark:text-(--secondary)"
      >
        Volver al home
      </Link>
    </div>
  )
}
