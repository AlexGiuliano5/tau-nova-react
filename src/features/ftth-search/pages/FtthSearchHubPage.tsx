import { FtthSearchButtons } from '@/features/ftth-home/components/FtthSearchButtons'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function FtthSearchHubPage() {
  return (
    <>
      <FtthBreadcrumb title="Búsqueda" backHref="/ftth" />
      <div className="pt-5">
        <FtthSearchButtons />
      </div>
    </>
  )
}
