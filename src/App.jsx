import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { ROLE } from './features/auth/roles'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MyRequestsPage } from './pages/MyRequestsPage'
import { NewEvaluationPage } from './pages/NewEvaluationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestDetailRoute } from './pages/RequestDetailPage'
import { AdministradorPanel, EspecialistaPanel, SolicitantePanel } from './pages/RolePanels'
import { WorkspaceHome } from './pages/WorkspaceHome'

function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/registro" />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
        path="/app"
      >
        <Route element={<WorkspaceHome />} index />
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <NewEvaluationPage />
            </RoleRoute>
          }
          path="evaluaciones/nueva"
        />
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <MyRequestsPage />
            </RoleRoute>
          }
          path="solicitudes"
        />
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <RequestDetailRoute />
            </RoleRoute>
          }
          path="solicitudes/:id"
        />
        <Route element={<ProfilePage />} path="perfil" />
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <SolicitantePanel />
            </RoleRoute>
          }
          path="solicitante"
        />
        <Route
          element={
            <RoleRoute role={ROLE.ESPECIALISTA}>
              <EspecialistaPanel />
            </RoleRoute>
          }
          path="especialista"
        />
        <Route
          element={
            <RoleRoute role={ROLE.ADMINISTRADOR}>
              <AdministradorPanel />
            </RoleRoute>
          }
          path="administracion"
        />
        <Route element={<AccessDeniedPage />} path="sin-permiso" />
      </Route>

      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}

export default App
