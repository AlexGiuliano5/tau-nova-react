import clsx from 'clsx'
import { useState, useTransition } from 'react'

import { isValidTreeData, saveTreeToLocalStorage } from '@/features/ftth/lib/tree-cache'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import { PreferencesSectionPanel } from '@/features/ont-preferences/components/PreferencesSectionPanel'
import { saveFtthTreePreferences } from '@/features/tree-preferences/api/tree-preferences'
import { FtthPreferencesTree } from '@/features/tree-preferences/components/FtthPreferencesTree'
import { buildHiddenRegionsPayload } from '@/features/tree-preferences/lib/view-model'
import type { FtthTreePreferencesViewModel } from '@/features/tree-preferences/types'

interface Props {
  initialData: FtthTreePreferencesViewModel
  legajo: string
}

type SaveMessage = {
  type: 'success' | 'error'
  text: string
}

export function FtthTreePreferencesPanel({ initialData, legajo }: Props) {
  const setTreeData = useFtthTreeStore((state) => state.setTreeData)
  const [selection, setSelection] = useState(initialData.selection)
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null)
  const [isSaving, startSaveTransition] = useTransition()

  const handleSave = () => {
    startSaveTransition(async () => {
      setSaveMessage(null)

      const opciones = buildHiddenRegionsPayload(initialData.nodes, selection)
      const result = await saveFtthTreePreferences(legajo, opciones)

      if (!result.ok) {
        setSaveMessage({
          type: 'error',
          text: resolveSaveErrorMessage(result.error),
        })
        return
      }

      if (isValidTreeData(result.treeData)) {
        setTreeData(result.treeData)
        saveTreeToLocalStorage(result.treeData)
      }

      setSaveMessage({
        type: 'success',
        text: 'Regiones FTTH guardadas con éxito.',
      })

      window.setTimeout(() => setSaveMessage(null), 5000)
    })
  }

  return (
    <PreferencesSectionPanel
      title="Árbol FTTH"
      description="Elegí qué regiones querés ver en el menú de topología. Las subregiones desmarcadas quedarán ocultas."
      actions={
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className={clsx(
            'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-opacity',
            isSaving
              ? 'cursor-wait bg-(--primary)/70 opacity-80 dark:bg-(--secondary)/70'
              : 'bg-(--primary) hover:opacity-95 dark:bg-(--secondary)',
          )}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      }
    >
      <div className="mx-auto w-full max-w-2xl">
        {saveMessage ? (
          <p
            role="status"
            className={clsx(
              'mb-4 rounded-xl border px-3 py-2.5 text-xs leading-relaxed',
              saveMessage.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
            )}
          >
            {saveMessage.text}
          </p>
        ) : null}

        <FtthPreferencesTree
          nodes={initialData.nodes}
          selection={selection}
          defaultExpandedKeys={initialData.expandedKeys}
          onSelectionChange={setSelection}
        />
      </div>
    </PreferencesSectionPanel>
  )
}

function resolveSaveErrorMessage(
  error: 'auth' | 'validation' | 'save' | 'unknown',
): string {
  if (error === 'auth') {
    return 'Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.'
  }
  if (error === 'validation') {
    return 'No pudimos validar las regiones seleccionadas.'
  }
  if (error === 'save') {
    return 'Error al guardar las regiones FTTH.'
  }
  return 'Ocurrió un error inesperado al guardar.'
}
