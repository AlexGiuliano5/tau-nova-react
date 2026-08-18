export type PortTreeNodeType = 'circle' | 'triangle' | 'square' | 'unknown'

export type PortTreeSeverity =
  | 'GOOD'
  | 'REDUCED_ROBUSTNESS'
  | 'DEGRADED'
  | 'SWITCHED_OFF'
  | 'INTERRUPTED'

export interface BffPortTreeOntChild {
  name: string
  ont: string
  type: PortTreeNodeType
  severity: PortTreeSeverity
  childs: unknown[]
}

export interface BffPortTreeDistributionChild {
  name: string
  type: PortTreeNodeType
  childs: BffPortTreeOntChild[]
}

export interface BffPortTreeResponseChild {
  name: string
  type: PortTreeNodeType
  childs: BffPortTreeDistributionChild[]
}

export interface BffPortTreeResponse {
  name: string
  type: PortTreeNodeType
  childs: BffPortTreeResponseChild[]
}

export type PortTopologyIssue = 'none' | 'no-data' | 'error' | 'unexpected'

export interface GetOltPortTreeResult {
  tree: BffPortTreeResponse | null
  issue: PortTopologyIssue
}
