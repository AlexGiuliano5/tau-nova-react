/** Hook CSS compartido: cabecera opaca, filtros y paginador (ver `ftth-datatable.css`). */
export const FTTH_DATA_TABLE_HOOK_CLASSNAME = 'app-ftth-data-table'

/**
 * Shell sin scroll vertical interno: muestra todas las filas de la página + footer.
 * El scroll vertical lo hace la página; solo hay overflow-x en el wrapper de la tabla.
 */
export const FTTH_DATA_TABLE_SHELL_PAGE_ROWS_CLASSNAME =
  'ftth-grid-table--page-rows flex h-auto min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-visible p-3'

/** Overrides Prime/Tailwind cuando la grilla es compacta. */
export const FTTH_DATA_TABLE_COMPACT_DATATABLE_CLASSNAME = [
  '[&_.p-datatable]:!h-auto',
  '[&_.p-datatable]:!min-h-0',
  '[&_.p-datatable]:!flex-none',
  '[&_.p-datatable-wrapper]:!h-auto',
  '[&_.p-datatable-wrapper]:!min-h-0',
  '[&_.p-datatable-wrapper]:!flex-none',
  '[&_.p-datatable-wrapper]:!overflow-visible',
].join(' ')

export const ONT_NEIGHBORS_TABLE_FULL_CLASSNAME = [
  FTTH_DATA_TABLE_HOOK_CLASSNAME,
  'w-full',
  'text-xs',
  'min-h-0',
  '[&_.p-datatable-wrapper]:min-h-0',
  '[&_.p-datatable-wrapper]:overflow-x-auto',
  '[&_.p-datatable-thead>tr>th]:whitespace-nowrap',
  '[&_.p-datatable-thead>tr>th]:!bg-(--table-header)',
  '[&_.p-datatable-thead>tr>th]:py-1',
  '[&_.p-datatable-thead>tr>th]:px-1.5',
  '[&_.p-datatable-thead>tr>th]:font-medium',
  '[&_.p-datatable-thead>tr>th]:text-center',
  '[&_.p-datatable-thead>tr>th]:align-middle',
  '[&_.p-datatable-thead>tr>th]:leading-tight',
  '[&_.p-datatable-thead>tr>th]:!border-r',
  '[&_.p-datatable-thead>tr>th]:!border-(--table-stroke)',
  '[&_.p-datatable-thead>tr>th:last-child]:!border-r-0',
  '[&_.p-column-header-content]:items-center',
  '[&_.p-column-header-content]:justify-center',
  '[&_.p-column-header-content]:gap-0.5',
  '[&_.p-sortable-column-icon]:text-[0.65rem]',
  '[&_.p-datatable-tbody>tr>td]:bg-(--table-content)',
  '[&_.p-datatable-tbody>tr>td]:whitespace-nowrap',
  '[&_.p-datatable-tbody>tr>td]:py-1',
  '[&_.p-datatable-tbody>tr>td]:px-1.5',
  '[&_.p-datatable-tbody>tr>td]:text-center',
  '[&_.p-datatable-tbody>tr>td]:align-middle',
  '[&_.p-datatable-tbody>tr>td]:border-b',
  '[&_.p-datatable-tbody>tr>td]:border-r',
  '[&_.p-datatable-tbody>tr>td]:border-(--table-stroke)',
  '[&_.p-datatable-tbody>tr>td:last-child]:border-r-0',
  '[&_.p-datatable-tbody>tr.p-highlight>td]:bg-(--primary)/10',
  'dark:[&_.p-datatable-tbody>tr.p-highlight>td]:bg-(--secondary-2)/30',
].join(' ')

export const ONT_NEIGHBORS_TABLE_PREVIEW_CLASSNAME = [
  FTTH_DATA_TABLE_HOOK_CLASSNAME,
  'w-full',
  'text-sm',
  '[&_.p-datatable-table]:w-full',
  '[&_.p-datatable-thead>tr>th]:!bg-(--table-header)',
  '[&_.p-datatable-thead>tr>th]:text-center',
  '[&_.p-datatable-thead>tr>th]:font-semibold',
  '[&_.p-datatable-thead>tr>th]:py-2',
  '[&_.p-datatable-thead>tr>th]:border-(--table-stroke)',
  '[&_.p-column-header-content]:justify-center',
  '[&_.p-datatable-tbody>tr>td]:bg-(--table-content)',
  '[&_.p-datatable-tbody>tr>td]:text-center',
  '[&_.p-datatable-tbody>tr>td]:py-1.5',
  '[&_.p-datatable-tbody>tr>td]:border-b',
  '[&_.p-datatable-tbody>tr>td]:border-(--table-stroke)',
].join(' ')

export const FTTH_DESKTOP_DATATABLE_FILTER_CLASSNAME = '[&_.p-column-filter-row]:min-w-0'
