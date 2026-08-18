import { FtthHomeSection } from '@/features/ftth-home/components/FtthHomeSection'
import { FtthSearchButtons } from '@/features/ftth-home/components/FtthSearchButtons'

export function FtthHomePage() {
  return (
    <>
      <div className="flex min-h-0 flex-col md:min-h-full md:flex-1 md:overflow-hidden">
        <FtthHomeSection />
      </div>
      <div className="mx-5 flex w-auto flex-col items-center rounded-2xl py-7 md:hidden">
        <span>Te damos la bienvenida</span>
        <p className="font-semibold">¿Qué búsqueda querés hacer hoy?</p>
      </div>
      <div className="md:hidden">
        <FtthSearchButtons />
      </div>
    </>
  )
}
