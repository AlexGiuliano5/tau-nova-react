'use client';

import { useState } from 'react';

import { useMdUp } from '@/shared/hooks/use-md-up';
import type { OltSlotPortGridModel } from '@/features/olt/types/slot-port';
import { type OltSlotPortCellView, SlotPortSeverity } from '@/features/olt/types/slot-port';

import {
  OLT_DISTRIBUCION_COLS_PER_PAGE,
  OltDistribucionCarousel
} from './OltDistribucionCarousel';

interface Props {
  model: OltSlotPortGridModel;
  /** Segmento de ruta `[olt]` tal como en la URL (se usa en `encodeURIComponent` al navegar). */
  oltRouteParam: string;
  desktopFullView?: boolean;
}

export function OltDistribucionCardInteractive({
  model,
  oltRouteParam,
  desktopFullView = false
}: Props) {
  const isDesktop = useMdUp();
  const useFullDesktopView = desktopFullView && isDesktop;
  const [page, setPage] = useState(0);
  const totalSlots = Math.max(model.totalSlots, 1);

  const startCol = page * OLT_DISTRIBUCION_COLS_PER_PAGE;
  const colCount = Math.min(OLT_DISTRIBUCION_COLS_PER_PAGE, totalSlots - startCol);
  const activeFromSlot = startCol;
  const activeToSlot = startCol + colCount - 1;

  const carousel = useFullDesktopView ? (
    <OltDistribucionCarousel
      model={model}
      oltRouteParam={oltRouteParam}
      page={0}
      onPageChange={() => {}}
      colsPerPage={totalSlots}
      hideNavigation
      hideIndicators
      disableSwipe
      fitToContainer
    />
  ) : (
    <>
      <OltDistribucionOverview
        rows={model.rows}
        totalSlots={totalSlots}
        activeFromSlot={activeFromSlot}
        activeToSlot={activeToSlot}
      />
      <OltDistribucionCarousel
        model={model}
        oltRouteParam={oltRouteParam}
        page={page}
        onPageChange={setPage}
      />
    </>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3 md:gap-2.5">
      <header>
        <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
          Distribución OLT
        </h2>
      </header>
      {carousel}
    </div>
  );
}

function OltDistribucionOverview({
  rows,
  totalSlots,
  activeFromSlot,
  activeToSlot
}: {
  rows: OltSlotPortGridModel['rows'];
  totalSlots: number;
  activeFromSlot: number;
  activeToSlot: number;
}) {
  const slotNumbers = Array.from({ length: totalSlots }, (_, i) => i);

  return (
    <div className="flex items-start gap-3 border-b border-(--table-stroke) pb-3">
      <section
        className="grid shrink-0 gap-px rounded-md border border-(--table-stroke) bg-(--table-stroke) p-px"
        style={{ gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 5px))` }}
        aria-label={`Vista resumida. Bloque activo: placas ${activeFromSlot + 1} a ${activeToSlot + 1}`}
      >
        {rows.map(row =>
          slotNumbers.map(placa => {
            const inBlock = placa >= activeFromSlot && placa <= activeToSlot;
            return (
              <div
                key={`overview-p${row.port}-s${placa}`}
                aria-hidden="true"
                className={`aspect-square w-full min-w-0 rounded-[1px] ${overviewTone(row.cells[placa] ?? null)} ${inBlock ? 'relative z-1 ring-2 ring-inset ring-(--primary-2) dark:ring-(--secondary)' : ''}`}
              />
            );
          })
        )}
      </section>
    </div>
  );
}

function overviewTone(cell: OltSlotPortCellView | null): string {
  if (!cell) {
    return 'bg-(--table-header)';
  }
  switch (cell.severity) {
    case SlotPortSeverity.Ok:
      return 'bg-[var(--card-green)]';
    case SlotPortSeverity.Warning:
      return 'bg-[var(--card-yellow)]';
    case SlotPortSeverity.Critical:
      return 'bg-[var(--card-red)]';
    default:
      return 'bg-[var(--card-green)]';
  }
}
