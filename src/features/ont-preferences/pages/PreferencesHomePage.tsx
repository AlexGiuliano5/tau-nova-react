import { PreferencesSectionPanel } from '@/features/ont-preferences/components/PreferencesSectionPanel'

export function PreferencesHomePage() {
  return (
    <PreferencesSectionPanel
      title="Preferencias"
      description="Personalizá cómo se ve y se comporta TAU Nova."
    >
      <p className="hidden text-sm text-(--text-secondary) md:block">
        Elegí una opción del menú lateral para empezar.
      </p>
      <p className="text-sm text-(--text-secondary) md:hidden">
        Elegí una sección para configurar árbol o pantalla ONT.
      </p>
    </PreferencesSectionPanel>
  )
}
