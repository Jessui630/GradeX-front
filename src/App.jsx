import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { ROLE } from './features/auth/roles'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MyCertificatesPage } from './pages/MyCertificatesPage'
import { MyRequestsPage } from './pages/MyRequestsPage'
import { NewEvaluationPage } from './pages/NewEvaluationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestDetailRoute } from './pages/RequestDetailPage'
import { SpecialistAssignmentsPage } from './pages/SpecialistAssignmentsPage'
import { SpecialistEvaluationPage } from './pages/SpecialistEvaluationPage'
import { VerifyCertificatePage } from './pages/VerifyCertificatePage'
import { WorkspaceHome } from './pages/WorkspaceHome'

function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/registro" />
      <Route element={<VerifyCertificatePage />} path="/verificar" />
      <Route element={<VerifyCertificatePage />} path="/verificar/:token" />

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
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <MyCertificatesPage />
            </RoleRoute>
          }
          path="certificados"
        />
        <Route element={<NotificationsPage />} path="notificaciones" />
        <Route element={<ProfilePage />} path="perfil" />
        <Route
          element={
            <RoleRoute role={ROLE.SOLICITANTE}>
              <WorkspaceHome />
            </RoleRoute>
          }
          path="solicitante"
        />
        <Route
          element={
            <RoleRoute role={ROLE.ESPECIALISTA}>
              <SpecialistAssignmentsPage />
            </RoleRoute>
          }
          path="especialista"
        />
        <Route
          element={
            <RoleRoute role={ROLE.ESPECIALISTA}>
              <SpecialistEvaluationPage />
            </RoleRoute>
          }
          path="especialista/asignaciones/:id"
        />
        <Route
          element={
            <RoleRoute role={ROLE.ADMINISTRADOR}>
              <AdminDashboardPage />
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
