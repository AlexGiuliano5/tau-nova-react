import { Navigate, Route, Routes } from 'react-router-dom'

import { GuestOnlyRoute } from '@/features/auth/components/GuestOnlyRoute'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RootRedirect } from '@/features/auth/pages/RootRedirect'
import { FtthTreeNavigatorPage } from '@/features/ftth/pages/FtthTreeNavigatorPage'
import { FtthHomePage } from '@/features/ftth-home/pages/FtthHomePage'
import { FtthSearchHubPage } from '@/features/ftth-search/pages/FtthSearchHubPage'
import { NetworkElementSearchPage } from '@/features/ftth-search/pages/NetworkElementSearchPage'
import { OltDetailLayout } from '@/features/olt/pages/OltDetailLayout'
import { OltInformacionOntPage } from '@/features/olt/pages/OltInformacionOntPage'
import { OltSummaryPage } from '@/features/olt/pages/OltSummaryPage'
import { OntDetailLayout } from '@/features/ont/pages/OntDetailLayout'
import { OntHistoricalComparisonPage } from '@/features/ont/pages/OntHistoricalComparisonPage'
import { OntVecinosPage } from '@/features/ont/pages/OntVecinosPage'
import { OntPreferencesPage } from '@/features/ont-preferences/pages/OntPreferencesPage'
import { PreferencesHomePage } from '@/features/ont-preferences/pages/PreferencesHomePage'
import { PreferencesLayout } from '@/features/ont-preferences/pages/PreferencesLayout'
import { PortDetailPage } from '@/features/port/pages/PortDetailPage'
import { PortMetricsTablePage } from '@/features/port/pages/PortMetricsTablePage'
import { FtthLayout } from '@/features/shell/components/FtthLayout'
import { FtthTreePreferencesPage } from '@/features/tree-preferences/pages/FtthTreePreferencesPage'
import { PlaceholderPage } from '@/shared/pages/PlaceholderPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/ftth" element={<FtthLayout />}>
          <Route index element={<FtthHomePage />} />
          <Route path="busqueda" element={<FtthSearchHubPage />} />
          <Route path="busqueda/elemento-de-red" element={<NetworkElementSearchPage />} />
          <Route path="busqueda/arbol" element={<FtthTreeNavigatorPage />} />
          <Route path="busqueda/*" element={<PlaceholderPage title="Búsqueda" />} />
          <Route path="herramientas" element={<PlaceholderPage title="Herramientas" />} />
          <Route path="herramientas/*" element={<PlaceholderPage title="Herramientas" />} />

          <Route path="preferencias" element={<PreferencesLayout />}>
            <Route index element={<PreferencesHomePage />} />
            <Route path="ont" element={<OntPreferencesPage />} />
            <Route path="arbol" element={<FtthTreePreferencesPage />} />
            <Route path="*" element={<Navigate to="/ftth/preferencias" replace />} />
          </Route>

          <Route path="olt/:olt" element={<OltDetailLayout />}>
            <Route index element={<OltSummaryPage />} />
            <Route path="informacion-ont" element={<OltInformacionOntPage />} />
            <Route path="placa/:placa/puerto/:puerto" element={<PortDetailPage />} />
            <Route path="placa/:placa/puerto/:puerto/tabla" element={<PortMetricsTablePage />} />
            <Route
              path="placa/:placa/puerto/:puerto/*"
              element={<PortDetailPage />}
            />
          </Route>

          <Route path="ont/comparar-historicos" element={<OntHistoricalComparisonPage />} />
          <Route path="ont/:ont/vecinos" element={<OntVecinosPage />} />

          {/* splat: el layout maneja info / graficos-historicos (keep-alive, sin Outlet) */}
          <Route path="ont/:ont/*" element={<OntDetailLayout />} />

          <Route path="reporte" element={<PlaceholderPage title="Reporte" />} />
        </Route>

        <Route
          path="/planta-interna"
          element={
            <PlaceholderPage
              title="Planta Interna"
              description="Stub de migración. El home FTTH ya está disponible."
            />
          }
        />
        <Route path="/planta-interna/*" element={<Navigate to="/planta-interna" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
