import { tieneRol } from '../features/auth/roles'
import { useAuth } from '../features/auth/auth-context'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'

export function RoleRoute({ role, children }) {
  const { usuario } = useAuth()

  if (!tieneRol(usuario, role)) {
    return <AccessDeniedPage />
  }

  return children
}
