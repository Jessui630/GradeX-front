import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { contarNoLeidas } from '../features/notificaciones/notificaciones.api'
import { Icon } from './Icon'

export function NotificationsLink({ onClick }) {
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    let activo = true
    function cargar() {
      contarNoLeidas()
        .then((resultado) => {
          if (activo) setNoLeidas(resultado.noLeidas ?? 0)
        })
        .catch(() => {
          // El aviso no bloquea la navegación principal.
        })
    }
    cargar()
    const intervalo = window.setInterval(cargar, 60_000)
    return () => {
      activo = false
      window.clearInterval(intervalo)
    }
  }, [])

  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      to="/app/notificaciones"
    >
      <Icon name="bell" size={18} />
      Notificaciones
      {noLeidas > 0 ? <span className="badge badge-warn">{noLeidas}</span> : null}
    </NavLink>
  )
}
