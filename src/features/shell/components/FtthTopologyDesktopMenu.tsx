import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IoChevronDown, IoChevronForward } from 'react-icons/io5'
import { useLocation, useNavigate } from 'react-router-dom'

import { mapTopologyMenuNodes, type TopologyMenuNode } from '@/features/ftth/lib/topology-menu-mapper'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import { useDesktopNavMenuWithSidebar } from '@/features/shell/hooks/use-desktop-nav-menu-with-sidebar'

const TRIGGER_CLASSNAME =
  'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm leading-none font-semibold text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:text-(--text-primary)/80 dark:hover:bg-white/8 dark:hover:text-(--text-primary)'

const ITEM_CLASSNAME =
  'group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] font-medium text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--primary-2) dark:hover:bg-white/8 dark:focus-visible:outline-(--secondary)'

const topologyColumnLabels = ['País', 'Región', 'Subregión', 'HUB', 'OLT'] as const

export function FtthTopologyDesktopMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const treeData = useFtthTreeStore((state) => state.treeData)
  const menuNodes = useMemo(() => mapTopologyMenuNodes(treeData), [treeData])
  const rootRef = useRef<HTMLDivElement | null>(null)
  const suppressAutoOpenUntilRef = useRef(0)
  const fixedPathByDepthRef = useRef<string[]>([])
  const closeOnLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [fixedPathByDepth, setFixedPathByDepth] = useState<string[]>([])
  const [hoverPathByDepth, setHoverPathByDepth] = useState<string[]>([])
  const { tryOpenFromPointer, tryOpenFromClick } = useDesktopNavMenuWithSidebar()

  useEffect(() => {
    fixedPathByDepthRef.current = fixedPathByDepth
  }, [fixedPathByDepth])

  const activePathByDepth = useMemo(() => {
    if (fixedPathByDepth.length === 0) return hoverPathByDepth
    const merged = [...fixedPathByDepth]
    for (let depth = fixedPathByDepth.length; depth < hoverPathByDepth.length; depth += 1) {
      const hoveredId = hoverPathByDepth[depth]
      if (!hoveredId) break
      merged[depth] = hoveredId
    }
    return merged
  }, [fixedPathByDepth, hoverPathByDepth])

  const columns = useMemo(() => {
    if (!isOpen || menuNodes.length === 0) return []

    const result: TopologyMenuNode[][] = [menuNodes]
    let currentList: TopologyMenuNode[] = menuNodes

    for (let depth = 0; depth < activePathByDepth.length; depth += 1) {
      const selectedId = activePathByDepth[depth]
      const selectedNode = currentList.find((node) => node.id === selectedId)
      if (!selectedNode || selectedNode.children.length === 0) break
      result.push(selectedNode.children)
      currentList = selectedNode.children
    }

    return result
  }, [activePathByDepth, isOpen, menuNodes])

  const parentByNodeId = useMemo(() => {
    const map = new Map<string, string | null>()
    const walk = (nodes: TopologyMenuNode[], parentId: string | null) => {
      for (const node of nodes) {
        map.set(node.id, parentId)
        if (node.children.length > 0) walk(node.children, node.id)
      }
    }
    walk(menuNodes, null)
    return map
  }, [menuNodes])

  const buildPathToNode = (nodeId: string): string[] => {
    const chain: string[] = []
    let current: string | null = nodeId
    while (current) {
      chain.push(current)
      current = parentByNodeId.get(current) ?? null
    }
    return chain.reverse()
  }

  const openMenu = (source: 'hover' | 'focus' | 'click') => {
    if (menuNodes.length === 0) return
    if (source !== 'click' && Date.now() < suppressAutoOpenUntilRef.current) return
    setIsOpen(true)
  }

  const closeMenu = (source: 'default' | 'trigger' = 'default') => {
    if (closeOnLeaveTimerRef.current) {
      clearTimeout(closeOnLeaveTimerRef.current)
      closeOnLeaveTimerRef.current = null
    }
    setIsOpen(false)
    setFixedPathByDepth([])
    setHoverPathByDepth([])
    if (source === 'trigger') {
      suppressAutoOpenUntilRef.current = Date.now() + 180
    }
  }

  const cancelScheduledCloseOnLeave = () => {
    if (closeOnLeaveTimerRef.current) {
      clearTimeout(closeOnLeaveTimerRef.current)
      closeOnLeaveTimerRef.current = null
    }
  }

  const scheduleCloseOnLeave = () => {
    cancelScheduledCloseOnLeave()
    closeOnLeaveTimerRef.current = setTimeout(() => {
      closeOnLeaveTimerRef.current = null
      if (fixedPathByDepthRef.current.length === 0) closeMenu()
    }, 80)
  }

  const onPointerEnterMenuArea = (source: 'hover' | 'focus') => {
    cancelScheduledCloseOnLeave()
    openMenu(source)
  }

  const openBranchByHover = (node: TopologyMenuNode, depth: number) => {
    if (node.children.length === 0) return
    if (fixedPathByDepth[depth]) return
    setHoverPathByDepth((prev) => {
      const next = prev.slice(0, depth)
      next[depth] = node.id
      return next
    })
  }

  const onSelectNode = (node: TopologyMenuNode, depth: number) => {
    if (node.children.length > 0) {
      const nextFixedPath = buildPathToNode(node.id)
      setFixedPathByDepth((prev) => {
        if (prev[depth] === node.id) return prev.slice(0, depth)
        return nextFixedPath
      })
      setHoverPathByDepth((prev) => {
        if (prev[depth] === node.id) return prev.slice(0, depth)
        return nextFixedPath
      })
      return
    }
    if (!node.href) return
    closeMenu()
    navigate(node.href)
  }

  useEffect(() => {
    setIsOpen(false)
    setFixedPathByDepth([])
    setHoverPathByDepth([])
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (closeOnLeaveTimerRef.current) clearTimeout(closeOnLeaveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setFixedPathByDepth([])
        setHoverPathByDepth([])
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        setFixedPathByDepth([])
        setHoverPathByDepth([])
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      className={clsx(
        'relative hidden md:block',
        isOpen && 'z-70 after:absolute after:inset-x-0 after:top-full after:h-[0.45rem] after:content-[""]',
      )}
      onMouseLeave={scheduleCloseOnLeave}
    >
      <button
        type="button"
        className={clsx(
          TRIGGER_CLASSNAME,
          isOpen &&
            'bg-black/6 text-(--text-primary) dark:bg-white/10 dark:text-(--text-primary)',
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onMouseEnter={() => tryOpenFromPointer(onPointerEnterMenuArea, 'hover')}
        onMouseLeave={scheduleCloseOnLeave}
        onFocus={() => tryOpenFromPointer(onPointerEnterMenuArea, 'focus')}
        onClick={() => tryOpenFromClick(openMenu, isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            tryOpenFromClick(openMenu, isOpen)
          }
        }}
      >
        Topología
        <IoChevronDown
          size={14}
          className={clsx(
            'transition-transform',
            isOpen ? 'rotate-180 text-(--primary-2) dark:text-(--secondary)' : '',
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Topología de red"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-70 flex max-h-[64vh] min-w-[208px] overflow-hidden rounded-xl border border-black/10 bg-(--card) shadow-[0_14px_28px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_16px_34px_rgba(0,0,0,0.42)]"
          onMouseEnter={() => tryOpenFromPointer(onPointerEnterMenuArea, 'hover')}
          onMouseLeave={scheduleCloseOnLeave}
          onFocusCapture={() => tryOpenFromPointer(onPointerEnterMenuArea, 'focus')}
        >
          {columns.length > 0 ? (
            columns.map((nodes, depth) => (
              <div
                key={nodes.map((node) => node.id).join('|')}
                className={clsx(
                  'w-[208px] shrink-0 border-r border-black/8 p-1.5 dark:border-white/8',
                  depth === columns.length - 1 && 'border-r-0',
                )}
              >
                <p className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-(--text-secondary) uppercase">
                  {topologyColumnLabels[depth] ?? `Nivel ${depth + 1}`}
                </p>
                <div className="mb-1 border-b border-black/8 dark:border-white/8" />
                <div className="ftth-shell-scroll max-h-[56vh] overflow-y-auto">
                  {nodes.map((node) => {
                    const isActive = activePathByDepth[depth] === node.id
                    const isFixed = fixedPathByDepth[depth] === node.id
                    const hasChildren = node.children.length > 0
                    return (
                      <button
                        key={node.id}
                        type="button"
                        role="menuitem"
                        className={clsx(
                          ITEM_CLASSNAME,
                          isActive &&
                            'bg-black/7 text-(--text-primary) dark:bg-white/10 dark:text-(--text-primary)',
                          isFixed &&
                            'bg-(--primary)/12 text-(--text-primary) ring-1 ring-(--primary-2)/25 dark:bg-(--secondary)/22 dark:ring-(--secondary)/30',
                        )}
                        onMouseEnter={() => openBranchByHover(node, depth)}
                        onFocus={() => openBranchByHover(node, depth)}
                        onClick={() => onSelectNode(node, depth)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            closeMenu()
                          }
                          if (event.key === 'ArrowRight' && hasChildren) {
                            event.preventDefault()
                            openBranchByHover(node, depth)
                          }
                        }}
                      >
                        <span className="truncate">{node.label}</span>
                        {hasChildren ? (
                          <IoChevronForward
                            size={13}
                            className={clsx(
                              'ml-2 shrink-0 text-(--text-secondary) transition-colors group-hover:text-(--text-primary)',
                              isFixed && 'text-(--primary-2) dark:text-(--secondary)',
                            )}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-[260px] p-3 text-xs text-(--text-secondary)">
              No hay nodos de topología disponibles.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
