import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { isDirectOntGroupName } from '@/features/port/lib/port-tree-structure'
import {
  formatPortTreeSeverityShort,
  portTreeSeverityBadgeTone,
} from '@/features/port/lib/port-tree-severity'
import type {
  BffPortTreeResponse,
  PortTreeNodeType,
  PortTreeSeverity,
} from '@/features/port/types/port-tree'

interface Props {
  tree: BffPortTreeResponse;
  selectedNodeId: string;
  setSelectedNodeId: (nodeId: string) => void;
  desktopExpandedBranches: string[];
  setDesktopExpandedBranches: (updater: (prev: string[]) => string[]) => void;
  desktopExpandedCdos: string[];
  setDesktopExpandedCdos: (updater: (prev: string[]) => string[]) => void;
  highlightOnt?: string;
}

interface BranchLayout {
  id: string;
  name: string;
  type: PortTreeNodeType;
  cdoCount: number;
  ontCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CdoLayout {
  id: string;
  branchId: string;
  name: string;
  type: PortTreeNodeType;
  ontCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OntLayout {
  id: string;
  cdoId: string;
  ont: string;
  severity: PortTreeSeverity;
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TopologyLayout {
  canvasWidth: number;
  canvasHeight: number;
  contentBounds: { minX: number; minY: number; maxX: number; maxY: number };
  root: {
    id: "root";
    type: PortTreeNodeType;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  branches: BranchLayout[];
  cdos: CdoLayout[];
  onts: OntLayout[];
  rootToBranchPaths: Array<{ id: string; d: string }>;
  branchToCdoPaths: string[];
  branchToOntPaths: string[];
  cdoToOntPaths: string[];
}

export function PortTopologyOverviewDesktop({
  tree,
  selectedNodeId,
  setSelectedNodeId,
  desktopExpandedBranches,
  setDesktopExpandedBranches,
  desktopExpandedCdos,
  setDesktopExpandedCdos,
  highlightOnt,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgViewportRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(1100);
  const [svgViewportWidth, setSvgViewportWidth] = useState<number>(0);
  const navigate = useNavigate()
  const expandedBranchSet = useMemo(
    () => new Set(desktopExpandedBranches),
    [desktopExpandedBranches],
  );
  const expandedCdoSet = useMemo(
    () => new Set(desktopExpandedCdos),
    [desktopExpandedCdos],
  );

  useEffect(() => {
    const wrapperTarget = wrapperRef.current;
    const viewportTarget = svgViewportRef.current;
    if (!wrapperTarget || !viewportTarget) return;

    const updateSizes = () => {
      setAvailableWidth(Math.max(860, wrapperTarget.clientWidth - 4));
      setSvgViewportWidth(Math.max(0, viewportTarget.clientWidth));
    };

    updateSizes();
    const observer = new ResizeObserver(updateSizes);
    observer.observe(wrapperTarget);
    observer.observe(viewportTarget);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () =>
      buildTopologyLayout({
        tree,
        expandedBranchSet,
        expandedCdoSet,
        availableWidth,
      }),
    [tree, expandedBranchSet, expandedCdoSet, availableWidth],
  );
  const viewBoxPaddingX = 28;
  const viewBoxPaddingTop = 8;
  const viewBoxPaddingBottom = 32;
  const viewBoxMinX = layout.contentBounds.minX - viewBoxPaddingX;
  const viewBoxMinY = layout.contentBounds.minY - viewBoxPaddingTop;
  const viewBoxWidth =
    layout.contentBounds.maxX - layout.contentBounds.minX + viewBoxPaddingX * 2;
  const viewBoxHeight =
    layout.contentBounds.maxY -
    layout.contentBounds.minY +
    viewBoxPaddingTop +
    viewBoxPaddingBottom;
  const renderedScale = viewBoxWidth > 0 ? svgViewportWidth / viewBoxWidth : 0;
  const renderedContentHeight = viewBoxHeight * renderedScale;
  const desiredBottomPadding = 10;
  const svgWrapperHeight = clamp(
    renderedContentHeight + desiredBottomPadding,
    220,
    620,
  );
  const leftoverSpace = svgWrapperHeight - renderedContentHeight;
  const preserveAspectRatio =
    leftoverSpace > 60 ? "xMidYMid meet" : "xMidYMin meet";
  const visualCenterOffsetY = preserveAspectRatio === "xMidYMid meet" ? 6 : 0;
  const viewBoxY = viewBoxMinY - visualCenterOffsetY;

  return (
    <div className="mt-4 hidden pb-3 md:block">
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-lg border border-(--table-stroke)/70 bg-(--table-header)/15 p-4"
        style={{ height: `${svgWrapperHeight}px` }}
      >
        <div ref={svgViewportRef} className="h-full w-full">
          <svg
            width="100%"
            height="100%"
            viewBox={`${viewBoxMinX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio={preserveAspectRatio}
          >
            <defs>
              <pattern
                id="port-topology-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="rgb(148 163 184 / 0.09)" />
              </pattern>
            </defs>
            <rect
              width={layout.canvasWidth}
              height={layout.canvasHeight}
              fill="url(#port-topology-grid)"
            />

            {layout.rootToBranchPaths.map((path) => (
              <path
                key={path.id}
                d={path.d}
                fill="none"
                stroke="rgb(148 163 184 / 0.65)"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            ))}
            {layout.branchToCdoPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke="rgb(148 163 184 / 0.4)"
                strokeWidth={1.4}
              />
            ))}
            {layout.branchToOntPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke="rgb(148 163 184 / 0.4)"
                strokeWidth={1.3}
              />
            ))}
            {layout.cdoToOntPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke="rgb(148 163 184 / 0.3)"
                strokeWidth={1.1}
              />
            ))}

            <TopologyCardNode
              nodeId="root"
              x={layout.root.x}
              y={layout.root.y}
              width={layout.root.width}
              height={layout.root.height}
              nodeType={layout.root.type}
              title={tree.name}
              subtitle={`${tree.childs.length} ${tree.childs.length === 1 ? "NAP" : "NAPs"}`}
              selected={selectedNodeId === "root"}
              onClick={() => setSelectedNodeId("root")}
            />

            {layout.branches.map((branch) => {
              const isOpen = expandedBranchSet.has(branch.id);
              return (
                <TopologyCardNode
                  nodeId={branch.id}
                  key={branch.id}
                  x={branch.x}
                  y={branch.y}
                  width={branch.width}
                  height={branch.height}
                  nodeType={branch.type}
                  title={formatNodeLabel("NAP", branch.name)}
                  subtitle={`${branch.cdoCount} ${branch.cdoCount === 1 ? "CDO" : "CDOs"} | ${branch.ontCount} ${branch.ontCount === 1 ? "ONT" : "ONTs"} ${isOpen ? "▾" : "▸"}`}
                  selected={selectedNodeId === branch.id}
                  clickable
                  onClick={() => {
                    setSelectedNodeId(branch.id);
                    setDesktopExpandedBranches((prev) =>
                      prev.includes(branch.id)
                        ? prev.filter((value) => value !== branch.id)
                        : [...prev, branch.id],
                    );
                  }}
                />
              );
            })}

            {layout.cdos.map((cdo) => {
              const isOpen = expandedCdoSet.has(cdo.id);
              return (
                <TopologyCardNode
                  nodeId={cdo.id}
                  key={cdo.id}
                  x={cdo.x}
                  y={cdo.y}
                  width={cdo.width}
                  height={cdo.height}
                  nodeType={cdo.type}
                  title={formatNodeLabel("CDO", cdo.name)}
                  subtitle={`${cdo.ontCount} ${cdo.ontCount === 1 ? "ONT" : "ONTs"} ${isOpen ? "▾" : "▸"}`}
                  selected={selectedNodeId === cdo.id}
                  clickable
                  onClick={() => {
                    setSelectedNodeId(cdo.id);
                    setDesktopExpandedCdos((prev) =>
                      prev.includes(cdo.id)
                        ? prev.filter((value) => value !== cdo.id)
                        : [...prev, cdo.id],
                    );
                  }}
                />
              );
            })}

            {layout.onts.map((ont) => {
              const badgeLabel = formatPortTreeSeverityShort(ont.severity);
              const badgeWidth = statusBadgeWidth(badgeLabel);

              const isHighlightedOnt =
                normalizeOntForHighlight(ont.ont) ===
                normalizeOntForHighlight(highlightOnt);

              const navigateToOnt = () => {
                setSelectedNodeId(ont.id);
                navigate(ont.href);
              };

              return (
                <g key={ont.id} transform={`translate(${ont.x}, ${ont.y})`}>
                  <a
                    href={ont.href}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToOnt();
                    }}
                    style={{ cursor: "pointer" }}
                    aria-label={`Ver ONT ${ont.ont}`}
                  >
                    <title>{ont.ont}</title>
                    <rect
                      width={ont.width}
                      height={ont.height}
                      rx={8}
                      className={
                        isHighlightedOnt
                          ? "fill-yellow-100 dark:fill-yellow-400/20"
                          : "fill-[#eaf6ff] dark:fill-[#21183a]"
                      }
                      stroke={
                        isHighlightedOnt
                          ? "rgb(250 204 21 / 0.85)"
                          : selectedNodeId === ont.id
                            ? "rgb(99 102 241 / 0.9)"
                            : "rgb(148 163 184 / 0.42)"
                      }
                      strokeWidth={
                        isHighlightedOnt
                          ? 1.8
                          : selectedNodeId === ont.id
                            ? 1.4
                            : 1
                      }
                    />
                    <text
                      x={ontNodeTextLeftPadding}
                      y={ont.height / 2 + 3.7}
                      className="fill-slate-800 dark:fill-slate-100"
                      fontSize={11}
                      fontWeight={500}
                      pointerEvents="none"
                    >
                      {ont.ont}
                    </text>
                    <OntStatusBadge
                      x={resolveOntBadgeX(ont.width, badgeWidth)}
                      y={4}
                      label={badgeLabel}
                      severity={ont.severity}
                      pointerEvents="none"
                    />
                  </a>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function TopologyCardNode({
  nodeId,
  nodeType,
  x,
  y,
  width,
  height,
  title,
  subtitle,
  selected,
  clickable = false,
  onClick,
}: {
  nodeId: string;
  nodeType: PortTreeNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  selected: boolean;
  clickable?: boolean;
  onClick: () => void;
}) {
  const safeClipId = `topology-node-text-clip-${nodeId.replaceAll(":", "-").replaceAll(" ", "-")}`;
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={clickable ? "cursor-pointer" : undefined}
      onClick={onClick}
    >
      <defs>
        <clipPath id={safeClipId}>
          <rect
            x={29}
            y={7}
            width={Math.max(12, width - 41)}
            height={31}
            rx={2}
          />
        </clipPath>
      </defs>
      <rect
        width={width}
        height={height}
        rx={12}
        className="fill-cyan-100/70 dark:fill-violet-500/10"
        stroke={selected ? "rgb(99 102 241 / 0.95)" : "rgb(148 163 184 / 0.35)"}
        strokeWidth={selected ? 1.8 : 1.1}
      />
      <DesktopNodeTypeGlyph type={nodeType} />
      <text
        x={29}
        y={20}
        className="fill-slate-800 dark:fill-slate-100"
        fontSize={12.5}
        fontWeight={700}
        clipPath={`url(#${safeClipId})`}
      >
        {truncateStructuralTitle(title, width)}
      </text>
      <text
        x={29}
        y={35}
        className="fill-slate-600 dark:fill-slate-300"
        fontSize={11.5}
      >
        {subtitle}
      </text>
    </g>
  );
}

function DesktopNodeTypeGlyph({ type }: { type: PortTreeNodeType }) {
  if (type === "triangle") {
    return (
      <polygon
        points="12,12.5 20,25.5 4,25.5"
        className="fill-sky-600 dark:fill-violet-300 dark:stroke-white/60"
        strokeWidth={0.8}
      />
    );
  }
  if (type === "square") {
    return (
      <rect
        x={6}
        y={15}
        width={12}
        height={12}
        rx={2}
        className="fill-sky-300 stroke-sky-600 dark:fill-violet-800 dark:stroke-violet-200"
        strokeWidth={1.1}
      />
    );
  }
  return (
    <circle
      cx={12}
      cy={21}
      r={5}
      className="fill-sky-600 dark:fill-violet-300 dark:stroke-white/60"
      strokeWidth={0.8}
    />
  );
}

function buildTopologyLayout({
  tree,
  expandedBranchSet,
  expandedCdoSet,
  availableWidth,
}: {
  tree: BffPortTreeResponse;
  expandedBranchSet: Set<string>;
  expandedCdoSet: Set<string>;
  availableWidth: number;
}): TopologyLayout {
  const branchCardWidth = resolveStructuralNodeWidth(
    tree.childs.map((branch) => formatNodeLabel("NAP", branch.name)),
    216,
    280,
  );
  const cdoCardWidth = resolveStructuralNodeWidth(
    tree.childs.flatMap((branch) =>
      branch.childs
        .filter(
          (level2) =>
            !isOntOrOnuLabel(level2.name) && !isDirectOntGroupName(level2.name),
        )
        .map((cdo) => formatNodeLabel("CDO", cdo.name)),
    ),
    236,
    320,
  );
  const dimensions = resolveDimensions(availableWidth, {
    branchWidth: branchCardWidth,
    cdoWidth: cdoCardWidth,
  });

  const root = {
    id: "root" as const,
    type: tree.type,
    x: dimensions.rootX,
    y: 0,
    width: dimensions.rootWidth,
    height: 50,
  };
  const branches: BranchLayout[] = [];
  const cdos: CdoLayout[] = [];
  const onts: OntLayout[] = [];
  const rootToBranchPaths: Array<{ id: string; d: string }> = [];
  const branchToCdoPaths: string[] = [];
  const branchToOntPaths: string[] = [];
  const cdoToOntPaths: string[] = [];
  let maxContentRight = dimensions.cdoX + cdoCardWidth;

  let yCursor = dimensions.topPadding;
  const branchCenters: number[] = [];

  tree.childs.forEach((branch, branchIndex) => {
    const branchId = `branch:${branch.name}`;
    const visibleCdos = branch.childs.filter(
      (level2) => !isOntOrOnuLabel(level2.name),
    );
    const structuralCdos = visibleCdos.filter(
      (level2) => !isDirectOntGroupName(level2.name),
    );
    const branchOntCount = visibleCdos.reduce(
      (acc, cdo) => acc + cdo.childs.length,
      0,
    );
    const isBranchOpen = expandedBranchSet.has(branchId);
    const branchStartY = yCursor;
    const cdoCentersForBranch: number[] = [];
    const directOntGroupIds: string[] = [];

    if (isBranchOpen && visibleCdos.length > 0) {
      visibleCdos.forEach((cdoNode, cdoIndex) => {
        const cdoId = buildCdoId(branch.name, cdoNode.name, cdoIndex);
        const isDirectOntGroup = isDirectOntGroupName(cdoNode.name);
        let cdoY = yCursor;

        if (isDirectOntGroup) {
          directOntGroupIds.push(cdoId);
        } else {
          cdoY = yCursor;
          cdoCentersForBranch.push(cdoY + dimensions.cdoHeight / 2);
          cdos.push({
            id: cdoId,
            branchId,
            name: cdoNode.name,
            type: cdoNode.type,
            ontCount: cdoNode.childs.length,
            x: dimensions.cdoX,
            y: cdoY,
            width: cdoCardWidth,
            height: dimensions.cdoHeight,
          });
          yCursor += dimensions.cdoHeight;
        }

        const smallCdoGap =
          cdoNode.childs.length <= 2
            ? dimensions.cdoSpacingSmall
            : dimensions.cdoSpacing;
        const shouldShowOnts = isDirectOntGroup
          ? cdoNode.childs.length > 0
          : expandedCdoSet.has(cdoId) && cdoNode.childs.length > 0;

        if (shouldShowOnts) {
          const maxRowsPerColumn = resolveMaxRowsPerColumn(
            cdoNode.childs.length,
          );
          const columns = chunk(cdoNode.childs, maxRowsPerColumn);
          const gridTop = isDirectOntGroup ? branchStartY + 2 : cdoY + 2;
          let columnX = dimensions.ontX;
          columns.forEach((columnOnts, columnIndex) => {
            const columnWidth = Math.max(
              ...columnOnts.map((ontNode) =>
                resolveOntNodeWidth(ontNode.ont, ontNode.severity),
              ),
            );
            columnOnts.forEach((ontNode, rowIndex) => {
              const ontY =
                gridTop +
                rowIndex * (dimensions.ontHeight + dimensions.ontRowGap);
              const ontId = `ont:${branch.name}:${cdoId}:${ontNode.ont}:${columnIndex * maxRowsPerColumn + rowIndex}`;
              const ontLayout: OntLayout = {
                id: ontId,
                cdoId,
                ont: ontNode.ont,
                severity: ontNode.severity,
                href: buildOntHrefWithTopologyContext({
                  ont: ontNode.ont,
                  nap: branch.name,
                  cdo: isDirectOntGroup ? "" : cdoNode.name,
                }),
                x: columnX,
                y: ontY,
                width: columnWidth,
                height: dimensions.ontHeight,
              };
              onts.push(ontLayout);
              if (!isDirectOntGroup) {
                cdoToOntPaths.push(
                  curvePath(
                    dimensions.cdoX + cdoCardWidth,
                    cdoY + dimensions.cdoHeight / 2,
                    ontLayout.x,
                    ontLayout.y + ontLayout.height / 2,
                  ),
                );
              }
              maxContentRight = Math.max(
                maxContentRight,
                ontLayout.x + ontLayout.width,
              );
            });
            columnX += columnWidth + dimensions.ontColumnGap;
          });
          const tallestColumnItems = Math.max(
            ...columns.map((column) => column.length),
          );
          yCursor =
            gridTop +
            tallestColumnItems * dimensions.ontHeight +
            Math.max(0, tallestColumnItems - 1) * dimensions.ontRowGap +
            14;
        } else if (!isDirectOntGroup) {
          yCursor += dimensions.cdoGapCollapsed;
        }

        if (!isDirectOntGroup) {
          yCursor += smallCdoGap;
        }
      });
      if (structuralCdos.length > 0) {
        yCursor -= dimensions.cdoSpacing;
      }
    } else {
      yCursor += dimensions.branchHeight;
    }

    const branchCenterY =
      cdoCentersForBranch.length > 0
        ? average(cdoCentersForBranch)
        : branchStartY +
          Math.max(dimensions.branchHeight / 2, (yCursor - branchStartY) / 2);
    branchCenters.push(branchCenterY);

    for (const directGroupId of directOntGroupIds) {
      for (const ontLayout of onts) {
        if (ontLayout.cdoId !== directGroupId) {
          continue;
        }
        branchToOntPaths.push(
          curvePath(
            dimensions.branchX + branchCardWidth,
            branchCenterY,
            ontLayout.x,
            ontLayout.y + ontLayout.height / 2,
          ),
        );
      }
    }

    branches.push({
      id: branchId,
      name: branch.name,
      type: branch.type,
      cdoCount: structuralCdos.length,
      ontCount: branchOntCount,
      x: dimensions.branchX,
      y: branchCenterY - dimensions.branchHeight / 2,
      width: branchCardWidth,
      height: dimensions.branchHeight,
    });

    rootToBranchPaths.push({
      id: `root-branch-${branchId}`,
      d: curvePath(
        dimensions.rootX + dimensions.rootWidth,
        0,
        dimensions.branchX,
        branchCenterY,
        "ROOT_CENTER_Y",
      ),
    });
    visibleCdos.forEach((cdoNode, cdoIndex) => {
      if (isDirectOntGroupName(cdoNode.name)) {
        return;
      }
      const cdoId = buildCdoId(branch.name, cdoNode.name, cdoIndex);
      const cdoLayoutNode = cdos.find((item) => item.id === cdoId);
      if (!cdoLayoutNode) {
        return;
      }
      branchToCdoPaths.push(
        curvePath(
          dimensions.branchX + branchCardWidth,
          branchCenterY,
          dimensions.cdoX,
          cdoLayoutNode.y + cdoLayoutNode.height / 2,
        ),
      );
    });

    yCursor += dimensions.branchGap;
    if (branchIndex === tree.childs.length - 1) {
      yCursor -= Math.min(dimensions.branchGap, 12);
    }
  });

  const rootCenterY =
    branchCenters.length > 0
      ? average(branchCenters)
      : dimensions.topPadding + 50;
  root.y = rootCenterY - root.height / 2;
  const resolvedRootToBranchPaths = rootToBranchPaths.map((path) => ({
    ...path,
    d: path.d.replaceAll("ROOT_CENTER_Y", String(rootCenterY)),
  }));
  const contentBounds = computeContentBounds({
    root,
    branches,
    cdos,
    onts,
  });

  return {
    canvasWidth: Math.max(dimensions.canvasWidth, maxContentRight + 28),
    canvasHeight: Math.max(
      dimensions.minCanvasHeight,
      yCursor + dimensions.bottomPadding,
    ),
    contentBounds,
    root,
    branches,
    cdos,
    onts,
    rootToBranchPaths: resolvedRootToBranchPaths,
    branchToCdoPaths,
    branchToOntPaths,
    cdoToOntPaths,
  };
}

function resolveDimensions(
  width: number,
  structuralWidths: { branchWidth: number; cdoWidth: number },
) {
  const rootX = 24;
  const rootWidth = 210;
  const branchWidth = structuralWidths.branchWidth;
  const cdoWidth = structuralWidths.cdoWidth;
  const ontWidth = 200;
  const gapRootToBranch = 64;
  const gapBranchToCdo = 42;
  const gapCdoToOnt = 54;
  const branchX = rootX + rootWidth + gapRootToBranch;
  const cdoX = branchX + branchWidth + gapBranchToCdo;
  const ontX = cdoX + cdoWidth + gapCdoToOnt;

  return {
    rootX,
    rootWidth,
    branchX,
    branchWidth,
    cdoX,
    cdoWidth,
    ontX,
    ontWidth,
    ontHeight: 22,
    ontColumnGap: 6,
    ontRowGap: 4,
    topPadding: 28,
    bottomPadding: 22,
    branchHeight: 48,
    cdoHeight: 42,
    cdoSpacing: 10,
    cdoGapCollapsed: 12,
    branchGap: 12,
    cdoSpacingSmall: 10,
    minCanvasHeight: 280,
    canvasWidth: Math.max(width, ontX + ontWidth * 3 + 52),
  };
}

function resolveMaxRowsPerColumn(ontCount: number): number {
  if (ontCount <= 10) return 4;
  if (ontCount <= 20) return 5;
  if (ontCount <= 40) return 6;
  return 7;
}

function curvePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  rootYToken?: string,
) {
  const startY = rootYToken ?? fromY;
  const dx = Math.max(26, (toX - fromX) * 0.42);
  const c1x = fromX + dx;
  const c2x = toX - dx;
  return `M ${fromX} ${startY} C ${c1x} ${startY}, ${c2x} ${toY}, ${toX} ${toY}`;
}

function statusBadgeWidth(label: string): number {
  return Math.max(38, Math.min(70, label.length * 6 + 12));
}

function OntStatusBadge({
  x,
  y,
  label,
  severity,
  pointerEvents,
}: {
  x: number;
  y: number;
  label: string;
  severity: PortTreeSeverity;
  pointerEvents?: "none" | "auto";
}) {
  const tone = portTreeSeverityBadgeTone(severity);
  const width = statusBadgeWidth(label);
  const switchedOffTextClassName =
    severity === 'SWITCHED_OFF'
      ? "fill-slate-700 dark:fill-slate-200"
      : undefined;
  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents={pointerEvents}>
      <rect width={width} height={14} rx={999} fill={tone.fill} />
      <text
        x={width / 2}
        y={10.5}
        textAnchor="middle"
        className={switchedOffTextClassName}
        fill={switchedOffTextClassName ? undefined : tone.text}
        fontSize={9}
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );
}

function buildCdoId(
  branchName: string,
  cdoName: string,
  index: number,
): string {
  const safeName = cdoName.trim();
  return safeName
    ? `nap:${branchName}:${safeName}:${index}`
    : `nap:${branchName}:idx-${index}`;
}

function isOntOrOnuLabel(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith("ONT") || normalized.startsWith("ONU");
}

function formatNodeLabel(prefix: string, name: string): string {
  const safeName = name.trim();
  return safeName ? `${prefix} - ${safeName}` : prefix;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, current) => acc + current, 0) / values.length;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

const ontNodeTextLeftPadding = 8;
const ontNodeBadgeRightPadding = 6;
const ontNodeTextBadgeGap = 10;
const ontNodeCharWidthEstimate = 6.7;

function resolveOntNodeWidth(
  ontSerial: string,
  severity: PortTreeSeverity,
): number {
  const badgeWidth = statusBadgeWidth(formatPortTreeSeverityShort(severity));
  const textWidth = ontSerial.length * ontNodeCharWidthEstimate;
  return Math.ceil(
    ontNodeTextLeftPadding +
      textWidth +
      ontNodeTextBadgeGap +
      badgeWidth +
      ontNodeBadgeRightPadding,
  );
}

function resolveOntBadgeX(nodeWidth: number, badgeWidth: number): number {
  return nodeWidth - badgeWidth - ontNodeBadgeRightPadding;
}

function truncateStructuralTitle(value: string, nodeWidth: number): string {
  const textWidth = Math.max(72, nodeWidth - 24);
  const maxLength = Math.max(12, Math.floor(textWidth / 6.3));
  return truncate(value, maxLength);
}

function resolveStructuralNodeWidth(
  labels: string[],
  minWidth: number,
  maxWidth: number,
): number {
  const longestLabelLength = labels.reduce(
    (acc, label) => Math.max(acc, label.length),
    0,
  );
  if (longestLabelLength === 0) {
    return minWidth;
  }

  const estimatedWidth = 24 + longestLabelLength * 6.3;
  return Math.max(minWidth, Math.min(maxWidth, Math.round(estimatedWidth)));
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function computeContentBounds({
  root,
  branches,
  cdos,
  onts,
}: {
  root: { x: number; y: number; width: number; height: number };
  branches: BranchLayout[];
  cdos: CdoLayout[];
  onts: OntLayout[];
}): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = root.x;
  let minY = root.y;
  let maxX = root.x + root.width;
  let maxY = root.y + root.height;

  for (const branch of branches) {
    minX = Math.min(minX, branch.x);
    minY = Math.min(minY, branch.y);
    maxX = Math.max(maxX, branch.x + branch.width);
    maxY = Math.max(maxY, branch.y + branch.height);
  }

  for (const cdo of cdos) {
    minX = Math.min(minX, cdo.x);
    minY = Math.min(minY, cdo.y);
    maxX = Math.max(maxX, cdo.x + cdo.width);
    maxY = Math.max(maxY, cdo.y + cdo.height);
  }

  for (const ont of onts) {
    minX = Math.min(minX, ont.x);
    minY = Math.min(minY, ont.y);
    maxX = Math.max(maxX, ont.x + ont.width);
    maxY = Math.max(maxY, ont.y + ont.height);
  }

  return { minX, minY, maxX, maxY };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeOntForHighlight(value?: string): string {
  return value?.trim().toUpperCase() ?? "";
}

function buildOntHrefWithTopologyContext({
  ont,
  nap,
  cdo,
}: {
  ont: string;
  nap: string;
  cdo: string;
}): string {
  const params = new URLSearchParams();

  if (nap.trim()) {
    params.set("nap", nap.trim());
  }

  if (cdo.trim()) {
    params.set("cdo", cdo.trim());
  }

  const query = params.toString();

  return `/ftth/ont/${encodeURIComponent(ont)}/info${query ? `?${query}` : ""}`;
}
