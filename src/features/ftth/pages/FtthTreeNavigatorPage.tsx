import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  getTreeFromLocalStorage,
  isValidTreeData,
} from '@/features/ftth/lib/tree-cache'
import {
  buildNextLevelHref,
  buildOltHref,
  buildViewModel,
} from '@/features/ftth/lib/tree-navigation'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import { FtthNetworkLevelButton } from '@/features/ftth/ui/FtthNetworkLevelButton'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function FtthTreeNavigatorPage() {
  const [searchParams] = useSearchParams()
  const treeData = useFtthTreeStore((state) => state.treeData)
  const setTreeData = useFtthTreeStore((state) => state.setTreeData)

  useEffect(() => {
    if (isValidTreeData(treeData)) return
    const cached = getTreeFromLocalStorage()
    if (isValidTreeData(cached)) setTreeData(cached)
  }, [setTreeData, treeData])

  const viewModel = useMemo(
    () => buildViewModel(treeData?.tree ?? [], searchParams),
    [searchParams, treeData?.tree],
  )

  if (!treeData?.tree?.length) {
    return (
      <>
        <FtthBreadcrumb title="Búsqueda de árbol" backHref="/ftth/busqueda" />
        <div className="px-5 pt-5 text-sm text-(--text-secondary)">
          No hay datos de árbol disponibles para este usuario.
        </div>
      </>
    )
  }

  return (
    <>
      <FtthBreadcrumb title={viewModel.breadcrumbTitle} backHref={viewModel.backHref} />
      <div className="mx-5 flex flex-col gap-3 pt-5">
        {viewModel.nodesToRender.length > 0 ? (
          viewModel.nodesToRender.map((node) => {
            if (!viewModel.nextKey) {
              return <FtthNetworkLevelButton key={node.name} title={node.name} />
            }

            if (viewModel.nextKey === 'olt') {
              return (
                <FtthNetworkLevelButton
                  key={node.name}
                  title={node.name}
                  href={buildOltHref(node.name)}
                />
              )
            }

            return (
              <FtthNetworkLevelButton
                key={node.name}
                title={node.name}
                chevron
                href={buildNextLevelHref(
                  viewModel.selectedByKey,
                  viewModel.nextKey,
                  node.name,
                )}
              />
            )
          })
        ) : (
          <div className="text-sm text-(--text-secondary)">
            No hay más niveles para mostrar. Ya llegaste al último nivel del árbol.
          </div>
        )}
      </div>
    </>
  )
}
