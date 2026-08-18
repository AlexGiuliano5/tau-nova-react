import clsx from 'clsx'
import { useMemo, useState } from 'react'
import {
  IoChevronForward,
  IoGlobeOutline,
  IoLocationOutline,
  IoMapOutline,
} from 'react-icons/io5'

import {
  countCheckedLeaves,
  getNodeCheckState,
  toggleTreeNodeSelection,
} from '@/features/tree-preferences/lib/checkbox-selection'
import type {
  FtthPreferencesTreeNode,
  FtthTreeCheckboxSelection,
  FtthTreeNodeCheckState,
} from '@/features/tree-preferences/types'

interface Props {
  nodes: FtthPreferencesTreeNode[]
  selection: FtthTreeCheckboxSelection
  defaultExpandedKeys?: Record<string, boolean>
  onSelectionChange: (selection: FtthTreeCheckboxSelection) => void
}

const levelMeta = [
  { label: 'País', Icon: IoGlobeOutline },
  { label: 'Región', Icon: IoMapOutline },
  { label: 'Subregión', Icon: IoLocationOutline },
] as const

export function FtthPreferencesTree({
  nodes,
  selection,
  defaultExpandedKeys = {},
  onSelectionChange,
}: Props) {
  const [expandedKeys, setExpandedKeys] =
    useState<Record<string, boolean>>(defaultExpandedKeys)

  const leafCount = useMemo(
    () => countCheckedLeaves(nodes, selection),
    [nodes, selection],
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-(--card) dark:border-white/10">
      <div className="flex items-center justify-between gap-3 border-b border-black/8 bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-white/4 md:px-5">
        <div>
          <p className="text-sm font-semibold text-(--text-primary)">Regiones visibles</p>
          <p className="mt-0.5 text-xs text-(--text-secondary)">
            Marcá las subregiones que querés ver en el menú de topología.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-(--primary)/10 px-3 py-1 text-xs font-semibold text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)">
          {leafCount.checked} / {leafCount.total}
        </span>
      </div>

      <ul className="divide-y divide-black/6 dark:divide-white/8">
        {nodes.map((node) => (
          <TreeBranch
            key={node.key}
            node={node}
            depth={0}
            selection={selection}
            expandedKeys={expandedKeys}
            onToggleExpanded={(key) =>
              setExpandedKeys((current) => ({
                ...current,
                [key]: !current[key],
              }))
            }
            onToggleSelection={(key) =>
              onSelectionChange(toggleTreeNodeSelection(nodes, selection, key))
            }
          />
        ))}
      </ul>
    </div>
  )
}

function TreeBranch({
  node,
  depth,
  selection,
  expandedKeys,
  onToggleExpanded,
  onToggleSelection,
}: {
  node: FtthPreferencesTreeNode
  depth: number
  selection: FtthTreeCheckboxSelection
  expandedKeys: Record<string, boolean>
  onToggleExpanded: (key: string) => void
  onToggleSelection: (key: string) => void
}) {
  const hasChildren = Boolean(node.children?.length)
  const isExpanded = expandedKeys[node.key] ?? depth === 0
  const checkState = getNodeCheckState(node, selection)
  const level = levelMeta[Math.min(depth, levelMeta.length - 1)]
  const LevelIcon = level.Icon
  const isLeaf = !hasChildren

  return (
    <li>
      <TreeRow
        node={node}
        depth={depth}
        checkState={checkState}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        levelLabel={level.label}
        LevelIcon={LevelIcon}
        isLeaf={isLeaf}
        onToggleExpanded={() => onToggleExpanded(node.key)}
        onToggleSelection={() => onToggleSelection(node.key)}
      />

      {hasChildren && isExpanded ? (
        <ul
          className={clsx(
            'space-y-0.5 border-l border-black/10 pb-2 pl-3 dark:border-white/10',
            depth === 0 ? 'mx-3 mb-2 ml-5' : 'ml-8 mr-3',
          )}
        >
          {node.children?.map((child) => (
            <TreeBranch
              key={child.key}
              node={child}
              depth={depth + 1}
              selection={selection}
              expandedKeys={expandedKeys}
              onToggleExpanded={onToggleExpanded}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function TreeRow({
  node,
  depth,
  checkState,
  hasChildren,
  isExpanded,
  levelLabel,
  LevelIcon,
  isLeaf,
  onToggleExpanded,
  onToggleSelection,
}: {
  node: FtthPreferencesTreeNode
  depth: number
  checkState: FtthTreeNodeCheckState
  hasChildren: boolean
  isExpanded: boolean
  levelLabel: string
  LevelIcon: typeof IoGlobeOutline
  isLeaf: boolean
  onToggleExpanded: () => void
  onToggleSelection: () => void
}) {
  const isChecked = checkState === 'checked'
  const isPartial = checkState === 'partial'

  return (
    <div className={clsx('flex items-center gap-2', depth === 0 && 'bg-(--background)/60')}>
      {hasChildren ? (
        <button
          type="button"
          aria-label={isExpanded ? `Contraer ${node.label}` : `Expandir ${node.label}`}
          aria-expanded={isExpanded}
          onClick={(event) => {
            event.stopPropagation()
            onToggleExpanded()
          }}
          className="ml-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-(--text-secondary) transition-colors hover:bg-black/6 hover:text-(--text-primary) dark:hover:bg-white/10 md:ml-4"
        >
          <IoChevronForward
            size={14}
            className={clsx('transition-transform duration-200', isExpanded && 'rotate-90')}
          />
        </button>
      ) : (
        <span className="ml-3 inline-block h-7 w-7 shrink-0 md:ml-4" aria-hidden />
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={isPartial ? 'mixed' : isChecked}
        aria-label={`Seleccionar ${node.label}`}
        onClick={onToggleSelection}
        className={clsx(
          'group flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2.5 pr-3 text-left transition-colors md:pr-4',
          depth === 0 && 'py-3 pr-4 md:pr-5',
          isLeaf && isChecked && 'bg-(--primary)/4 dark:bg-(--secondary)/8',
          'hover:bg-black/3 dark:hover:bg-white/4',
          !hasChildren && 'rounded-r-lg',
        )}
      >
        <TreeCheckboxVisual checked={isChecked} partial={isPartial} />

        <span
          className={clsx(
            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            depth === 0
              ? 'bg-(--primary)/12 text-(--primary) dark:bg-(--secondary)/18 dark:text-(--secondary)'
              : 'bg-black/5 text-(--text-secondary) dark:bg-white/8',
          )}
        >
          <LevelIcon size={15} />
        </span>

        <div className="min-w-0 flex-1">
          <span
            className={clsx(
              'block truncate',
              depth === 0 &&
                'text-sm font-semibold uppercase tracking-wide text-(--text-primary)',
              depth === 1 && 'text-sm font-medium text-(--text-primary)',
              depth >= 2 && 'text-sm text-(--text-primary)',
            )}
          >
            {node.label}
          </span>
          {depth === 0 ? (
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
              {levelLabel}
            </span>
          ) : null}
        </div>

        {isLeaf ? (
          <span
            className={clsx(
              'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              isChecked
                ? 'bg-(--primary)/10 text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)'
                : 'bg-black/5 text-(--text-secondary) dark:bg-white/8',
            )}
          >
            {isChecked ? 'Visible' : 'Oculta'}
          </span>
        ) : null}
      </button>
    </div>
  )
}

function TreeCheckboxVisual({ checked, partial }: { checked: boolean; partial: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
        checked || partial
          ? 'border-(--primary-2) bg-(--primary-2) dark:border-(--secondary) dark:bg-(--secondary)'
          : 'border-(--outline) bg-(--card) group-hover:border-(--primary-2)/60 dark:group-hover:border-(--secondary)/60',
      )}
    >
      {checked ? (
        <svg viewBox="0 0 12 10" className="h-2.5 w-2.5 text-white">
          <path
            d="M1 5.2 4.2 8.4 11 1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {!checked && partial ? (
        <span className="block h-0.5 w-2 rounded-full bg-white" />
      ) : null}
    </span>
  )
}
