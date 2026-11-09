import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'

export function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" />
        <span>Comprobando tu sesión…</span>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return children
}
