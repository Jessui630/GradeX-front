import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../features/auth/auth-context'
import { etiquetaRol, ROLE, tieneRol } from '../features/auth/roles'
import { iniciales } from '../lib/iniciales'

export function AppShell() {
  const { usuario, cerrarSesion, errorSesion } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  const enlaces = [{ to: '/app', label: 'Resumen', icon: 'home', end: true }]

  if (tieneRol(usuario, ROLE.SOLICITANTE)) {
    enlaces.push({
      to: '/app/evaluaciones/nueva',
      label: 'Nueva evaluación',
      icon: 'spark',
    })
    enlaces.push({ to: '/app/solicitudes', label: 'Mis solicitudes', icon: 'clipboard' })
  }
  enlaces.push({ to: '/app/perfil', label: 'Perfil', icon: 'user' })

  async function salir() {
    setSaliendo(true)
    try {
      await cerrarSesion()
    } catch {
      // La sesión local se limpia aunque el servidor no responda; el usuario vuelve al acceso.
    } finally {
      setSaliendo(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>

      <header className="workspace-header">
        <Brand to="/app" />
        <button
          aria-controls="navegacion-principal"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          className="icon-button menu-toggle"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          type="button"
        >
          <Icon name={menuAbierto ? 'close' : 'menu'} />
        </button>

        <nav
          aria-label="Navegación principal"
          className={`workspace-nav${menuAbierto ? ' is-open' : ''}`}
          id="navegacion-principal"
        >
          {enlaces.map((enlace) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              end={enlace.end}
              key={enlace.to}
              onClick={() => setMenuAbierto(false)}
              to={enlace.to}
            >
              <Icon name={enlace.icon} size={18} />
              {enlace.label}
            </NavLink>
          ))}

          <div className="mobile-account">
            <div className="mobile-account-identity">
              <span aria-hidden="true" className="avatar">
                {iniciales(usuario?.nombreCompleto ?? '')}
              </span>
              <span>
                <strong>{usuario?.nombreCompleto}</strong>
                <small>{usuario?.roles?.map(etiquetaRol).join(' · ')}</small>
              </span>
            </div>
            <button
              className="nav-link nav-logout"
              disabled={saliendo}
              onClick={salir}
              type="button"
            >
              <Icon name="logout" size={18} />
              {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          </div>
        </nav>

        <UserMenu onLogout={salir} saliendo={saliendo} usuario={usuario} />
      </header>

      {errorSesion ? (
        <div className="session-warning" role="status">
          <Icon name="alert" size={18} />
          {errorSesion}
        </div>
      ) : null}

      <main className="workspace-main" id="contenido-principal">
        <Outlet />
      </main>

      <footer className="workspace-footer">
        <span>GradeX · Evaluación de originalidad</span>
        <Link to="/">Inicio</Link>
      </footer>
    </div>
  )
}
