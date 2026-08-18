import type { BffTreeResponse } from '@/features/ftth/types/tree'

export interface FtthPreferencesTreeNode {
  key: string
  label: string
  children?: FtthPreferencesTreeNode[]
}

export interface FtthHiddenRegion {
  pais: string
  region: string
  subregion: string
}

export interface FtthTreeCheckboxSelectionEntry {
  checked: boolean
  partialChecked?: boolean
}

export type FtthTreeCheckboxSelection = Record<string, FtthTreeCheckboxSelectionEntry>

export type FtthTreeNodeCheckState = 'checked' | 'unchecked' | 'partial'

export interface FtthTreePreferencesViewModel {
  nodes: FtthPreferencesTreeNode[]
  selection: FtthTreeCheckboxSelection
  expandedKeys: Record<string, boolean>
}

export type FtthTreePreferencesLoadResult =
  | ({ ok: true } & FtthTreePreferencesViewModel)
  | { ok: false; error: 'auth' | 'tree' | 'regions' | 'unknown' }

export type SaveFtthTreePreferencesResult =
  | { ok: true; treeData: BffTreeResponse | null }
  | { ok: false; error: 'auth' | 'validation' | 'save' | 'unknown' }
