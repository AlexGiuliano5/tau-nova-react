import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { resolveFtthPayloadNoticeIssue } from '@/features/ftth/lib/card-issue'
import {
  formatPortTreeSeverityLabel,
  portTreeSeverityBadgeClass,
  portTreeSeverityCircleClass,
} from '@/features/port/lib/port-tree-severity'
import { isDirectOntGroupName } from '@/features/port/lib/port-tree-structure'
import type {
  BffPortTreeResponse,
  PortTopologyIssue,
  PortTreeNodeType,
  PortTreeSeverity,
} from '@/features/port/types/port-tree'
import { PortTopologyOverviewDesktop } from '@/features/port/ui/PortTopologyOverviewDesktop'

interface Props {
  tree: BffPortTreeResponse | null
  issue: PortTopologyIssue
  highlightOnt?: string
}

const topologyCardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 xl:p-3 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3 md:gap-2.5 md:min-h-0'

export function PortTopologyCard({ tree, issue, highlightOnt }: Props) {
  const treeKey = tree
    ? [tree.name, ...tree.childs.map((child) => child.name)].join('|')
    : ''

  const noticeIssue = resolveFtthPayloadNoticeIssue(issue, tree !== null && tree.childs.length > 0)
  if (noticeIssue !== null || !tree) {
    return (
      <FtthCardIssueState
        title="Topología de puerto"
        issue={noticeIssue ?? 'no-data'}
        context="la topología de puerto de esta placa/puerto"
        cardClassName={topologyCardClassName}
        bodyClassName="min-h-[200px] md:min-h-[320px]"
      />
    )
  }

  return <PortTopologyTree key={treeKey} tree={tree} highlightOnt={highlightOnt} />
}

function PortTopologyTree({
  tree,
  highlightOnt,
}: {
  tree: BffPortTreeResponse
  highlightOnt?: string
}) {
  const initialExpanded = useMemo(() => tree.childs.map((branch) => branch.name), [tree.childs])
  const initialDesktopExpandedBranches = useMemo(
    () => tree.childs.map((branch) => `branch:${branch.name}`),
    [tree.childs],
  )
  const initialDesktopExpandedCdos = useMemo(
    () =>
      tree.childs.flatMap((branch) =>
        branch.childs.map((level2, index) => buildCdoId(branch.name, level2.name, index)),
      ),
    [tree.childs],
  )
  const [expandedNodes, setExpandedNodes] = useState<string[]>(initialExpanded)
  const [expandedNapNodes, setExpandedNapNodes] = useState<string[]>([])
  const [desktopExpandedBranches, setDesktopExpandedBranches] = useState(
    initialDesktopExpandedBranches,
  )
  const [desktopExpandedCdos, setDesktopExpandedCdos] = useState(initialDesktopExpandedCdos)
  const [selectedNodeId, setSelectedNodeId] = useState('root')

  return (
    <section className={topologyCardClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight tracking-tight text-(--text-primary) md:text-[1.05rem]">
          Topología de puerto
        </h2>
      </div>
      <MobileTopologyTree
        tree={tree}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        expandedNodes={expandedNodes}
        setExpandedNodes={setExpandedNodes}
        expandedNapNodes={expandedNapNodes}
        setExpandedNapNodes={setExpandedNapNodes}
        highlightOnt={highlightOnt}
      />
      <div className="hidden min-h-0 md:block md:min-h-[280px] md:flex-1">
        <PortTopologyOverviewDesktop
          tree={tree}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          desktopExpandedBranches={desktopExpandedBranches}
          setDesktopExpandedBranches={setDesktopExpandedBranches}
          desktopExpandedCdos={desktopExpandedCdos}
          setDesktopExpandedCdos={setDesktopExpandedCdos}
          highlightOnt={highlightOnt}
        />
      </div>
    </section>
  )
}

function MobileTopologyTree({
  tree,
  selectedNodeId,
  setSelectedNodeId,
  expandedNodes,
  setExpandedNodes,
  expandedNapNodes,
  setExpandedNapNodes,
  highlightOnt,
}: {
  tree: BffPortTreeResponse
  selectedNodeId: string
  setSelectedNodeId: (nodeId: string) => void
  expandedNodes: string[]
  setExpandedNodes: (updater: (prev: string[]) => string[]) => void
  expandedNapNodes: string[]
  setExpandedNapNodes: (updater: (prev: string[]) => string[]) => void
  highlightOnt?: string
}) {
  return (
    <div className="mt-1 md:hidden">
      <button
        type="button"
        onClick={() => setSelectedNodeId('root')}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 ${
          selectedNodeId === 'root'
            ? 'border-(--primary) bg-(--primary)/10 dark:border-(--secondary) dark:bg-(--secondary)/12'
            : 'border-(--table-stroke) bg-(--card)'
        }`}
      >
        <NodeTypeGlyph type={tree.type} />
        <span className="text-sm font-semibold text-(--text-primary)">{tree.name}</span>
      </button>

      <div className="ml-3 mt-3">
        <div className="border-l border-(--table-stroke) pl-4">
          {tree.childs.map((branch) => {
            const isExpanded = expandedNodes.includes(branch.name)
            const branchId = `branch:${branch.name}`
            const isSelected = selectedNodeId === branchId
            const ontCount = branch.childs.reduce((acc, node) => acc + node.childs.length, 0)
            const toggleBranch = () => {
              setSelectedNodeId(branchId)
              setExpandedNodes((prev) =>
                prev.includes(branch.name)
                  ? prev.filter((value) => value !== branch.name)
                  : [...prev, branch.name],
              )
            }
            return (
              <div key={branch.name} className="relative mb-3 pl-3">
                <span
                  className="pointer-events-none absolute top-6 -left-4 h-px w-7 bg-(--table-stroke)"
                  aria-hidden
                />
                <article
                  className={`rounded-lg border bg-(--card) ${
                    isSelected
                      ? 'border-(--primary) dark:border-(--secondary)'
                      : 'border-(--table-stroke)'
                  }`}
                >
                  <button
                    type="button"
                    onClick={toggleBranch}
                    className={`flex w-full items-center justify-between gap-3 rounded-t-lg px-3 py-2 text-left ${
                      isSelected ? 'bg-(--primary)/6 dark:bg-(--secondary)/14' : ''
                    }`}
                    aria-label={isExpanded ? 'Contraer rama' : 'Expandir rama'}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <NodeTypeGlyph type={branch.type} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-(--text-primary)">
                          {formatNodeLabel('NAP', branch.name)}
                        </p>
                        <p className="text-xs text-(--text-secondary)">{ontCount} ONTs conectadas</p>
                      </div>
                    </div>
                    <span className="text-(--text-secondary)" aria-hidden>
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-(--table-stroke) px-3 py-2">
                      {branch.childs.map((level2, level2Index) => {
                        const napId = buildCdoId(branch.name, level2.name, level2Index)
                        const napSelected = selectedNodeId === napId
                        const napOntCount = level2.childs.length
                        const isDirectOntGroup = isDirectOntGroupName(level2.name)
                        const isNapExpanded = expandedNapNodes.includes(napId)
                        const showOntList = isDirectOntGroup ? isExpanded : isNapExpanded
                        const toggleNap = () => {
                          setSelectedNodeId(napId)
                          setExpandedNapNodes((prev) =>
                            prev.includes(napId)
                              ? prev.filter((value) => value !== napId)
                              : [...prev, napId],
                          )
                        }

                        return (
                          <div key={napId} className="mb-2 last:mb-0">
                            {level2.name && !isDirectOntGroup ? (
                              <button
                                type="button"
                                onClick={toggleNap}
                                className={`mb-1 ml-2 flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs font-medium ${
                                  napSelected ? 'bg-(--primary)/8 dark:bg-(--secondary)/16' : ''
                                } cursor-pointer`}
                                aria-label={
                                  isNapExpanded
                                    ? `Contraer ${formatNodeLabel('CDO', level2.name)}`
                                    : `Expandir ${formatNodeLabel('CDO', level2.name)}`
                                }
                                aria-expanded={isNapExpanded}
                              >
                                <span className="truncate font-semibold text-(--text-secondary)">
                                  {formatNodeLabel('CDO', level2.name)}
                                </span>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-[11px] text-(--text-secondary)">
                                    {`${napOntCount} - ONT`}
                                  </span>
                                  <span className="text-(--text-secondary)" aria-hidden>
                                    {isNapExpanded ? '▾' : '▸'}
                                  </span>
                                </div>
                              </button>
                            ) : null}

                            {showOntList ? (
                              <ul className={`space-y-1 ${isDirectOntGroup ? 'ml-0' : 'ml-3'}`}>
                                {level2.childs.map((ontNode, ontIndex) => {
                                  const ontId = `ont:${branch.name}:${napId}:${ontNode.ont}:${ontIndex}`
                                  const ontSelected = selectedNodeId === ontId
                                  const isHighlightedOnt =
                                    normalizeOntForHighlight(ontNode.ont) ===
                                    normalizeOntForHighlight(highlightOnt)
                                  return (
                                    <li
                                      key={ontId}
                                      className={`flex items-center justify-between gap-3 rounded-md border px-2 py-1.5 ${
                                        isHighlightedOnt
                                          ? 'border-yellow-300/70 bg-yellow-200/40 dark:border-yellow-300/60 dark:bg-yellow-400/18'
                                          : ontSelected
                                            ? 'border-(--primary) bg-(--primary)/7 dark:border-(--secondary) dark:bg-(--secondary)/16'
                                            : 'border-transparent bg-(--table-header)'
                                      }`}
                                    >
                                      <Link
                                        to={`/ftth/ont/${encodeURIComponent(ontNode.ont)}/info`}
                                        onClick={() => setSelectedNodeId(ontId)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left no-underline"
                                        aria-label={`Ver ONT ${ontNode.ont}`}
                                      >
                                        <NodeTypeGlyph
                                          type={ontNode.type}
                                          severity={ontNode.severity}
                                        />
                                        <span className="truncate text-xs text-(--text-primary)">
                                          {ontNode.ont}
                                        </span>
                                      </Link>
                                      <span
                                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${portTreeSeverityBadgeClass(ontNode.severity)}`}
                                      >
                                        {formatPortTreeSeverityLabel(ontNode.severity)}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </article>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function buildCdoId(branchName: string, cdoName: string, index: number): string {
  const safeName = cdoName.trim()
  return safeName ? `nap:${branchName}:${safeName}:${index}` : `nap:${branchName}:idx-${index}`
}

function NodeTypeGlyph({
  type,
  severity,
}: {
  type: PortTreeNodeType
  severity?: PortTreeSeverity
}) {
  if (type === 'triangle') {
    return (
      <span
        className="inline-block size-0 border-r-[7px] border-b-11 border-l-[7px] border-r-transparent border-b-(--primary) border-l-transparent dark:border-b-(--secondary)"
        aria-hidden
      />
    )
  }
  if (type === 'square') {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-[2px] border-2 border-(--primary) bg-(--primary)/12 dark:border-(--secondary) dark:bg-(--secondary)/20"
        aria-hidden
      />
    )
  }
  return (
    <span
      className={`inline-block size-2 rounded-full ${portTreeSeverityCircleClass(severity)}`}
      aria-hidden
    />
  )
}

function formatNodeLabel(prefix: string, name: string): string {
  const safeName = name.trim()
  return safeName ? `${prefix} - ${safeName}` : prefix
}

function normalizeOntForHighlight(value?: string): string {
  return value?.trim().toUpperCase() ?? ''
}
