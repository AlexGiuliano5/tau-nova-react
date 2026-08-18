export interface BffTreeResponse {
  tree: TreeNode[]
  treeArray: TreeArrayItem[]
}

export interface TreeNode {
  name: string
  childs: TreeNode[]
}

export interface TreeArrayItem {
  type: TreeNodeType
  name: string
}

export type TreeNodeType = 'hub' | 'olt' | 'pais' | 'region' | 'subregion'

export const TreeType = {
  Hub: 'hub',
  Olt: 'olt',
  Pais: 'pais',
  Region: 'region',
  Subregion: 'subregion',
} as const
