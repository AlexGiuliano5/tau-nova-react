export type FtthDataIssue = 'none' | 'no-data' | 'error' | 'unexpected'

/** Estados mostrados en carteles de error / sin datos. */
export type FtthDisplayIssue = Exclude<FtthDataIssue, 'none'>

const ERROR_TONE_CLASS =
  'border-(--card-red) bg-(--card-red)/15 dark:border-(--card-red) dark:bg-(--card-red)/20'

const NO_DATA_TONE_CLASS =
  'border-(--card-yellow) bg-(--card-yellow)/15 dark:border-(--card-yellow) dark:bg-(--card-yellow)/20'

export function resolveFtthDisplayIssueToneClass(issue: FtthDisplayIssue): string {
  if (issue === 'error' || issue === 'unexpected') {
    return ERROR_TONE_CLASS
  }
  return NO_DATA_TONE_CLASS
}

export function resolveFtthIssueMessage(issue: FtthDisplayIssue, context?: string): string {
  if (issue === 'unexpected') {
    return 'Ocurrió un error inesperado. Probá nuevamente más tarde.'
  }

  if (issue === 'error') {
    if (context) {
      return `Ocurrió un error en la consulta de ${context}. Probá nuevamente más tarde.`
    }
    return 'Ocurrió un error en la consulta. Probá nuevamente más tarde.'
  }

  if (context) {
    return `No se encontraron datos de ${context}.`
  }
  return 'No se encontraron datos.'
}

export function resolveFtthCardIssueToneClass(issue: FtthDataIssue): string {
  if (issue === 'error' || issue === 'unexpected') {
    return ERROR_TONE_CLASS
  }
  if (issue === 'no-data') {
    return NO_DATA_TONE_CLASS
  }
  return ''
}

export function resolveFtthCardIssueMessage(issue: FtthDataIssue): string {
  if (issue === 'none') return ''
  return resolveFtthIssueMessage(issue)
}

export function hasFtthCardIssue(issue: FtthDataIssue): issue is Exclude<FtthDataIssue, 'none'> {
  return issue !== 'none'
}

export function isFtthErrorDisplayIssue(issue: FtthDataIssue): issue is 'error' | 'unexpected' {
  return issue === 'error' || issue === 'unexpected'
}

export function toFtthDisplayIssue(issue: FtthDataIssue): FtthDisplayIssue | null {
  if (issue === 'none') return null
  return issue
}

/** Determina si el payload requiere cartel y con qué variante. */
export function resolveFtthPayloadNoticeIssue(
  issue: FtthDataIssue,
  hasData: boolean,
): FtthDisplayIssue | null {
  if (issue === 'error' || issue === 'unexpected') return issue
  if (issue === 'no-data' || !hasData) return 'no-data'
  return null
}

export function resolveIssueBorderHex(issue: FtthDataIssue): string {
  if (issue === 'error' || issue === 'unexpected') return '#F43F5E'
  if (issue === 'no-data') return '#F59E0B'
  return '#94A3B8'
}
