import { useEffect, useId, useRef, useState } from 'react'
import { etiquetaRol } from '../features/auth/roles'
import { iniciales } from '../lib/iniciales'
import { Icon } from './Icon'

export function UserMenu({ usuario, saliendo, onLogout }) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)
  const botonRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!abierto) return undefined

    function cerrarAlHacerClicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false)
    }

    function cerrarConEscape(evento) {
      if (evento.key !== 'Escape') return
      setAbierto(false)
      botonRef.current?.focus()
    }

    document.addEventListener('pointerdown', cerrarAlHacerClicFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrarAlHacerClicFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  function cerrarSesion() {
    setAbierto(false)
    onLogout()
  }

  return (
    <div className="user-menu" ref={contenedorRef}>
      <button
        aria-controls={menuId}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label="Menú de cuenta"
        className="user-menu-trigger"
        onClick={() => setAbierto((actual) => !actual)}
        ref={botonRef}
        type="button"
      >
        <span aria-hidden="true" className="avatar">
          {iniciales(usuario?.nombreCompleto ?? '')}
        </span>
        <span className="workspace-user-data">
          <strong>{usuario?.nombreCompleto}</strong>
          <small>{usuario?.roles?.map(etiquetaRol).join(' · ')}</small>
        </span>
        <Icon className="user-menu-chevron" name="chevron-down" size={16} />
      </button>

      {abierto ? (
        <div aria-label="Cuenta" className="user-menu-popover" id={menuId} role="menu">
          <div className="user-menu-identity">
            <strong>{usuario?.nombreCompleto}</strong>
            <span>{usuario?.correo}</span>
            <span className="user-menu-role">
              {usuario?.roles?.map(etiquetaRol).join(' · ')}
            </span>
          </div>
          <button
            className="user-menu-item"
            disabled={saliendo}
            onClick={cerrarSesion}
            role="menuitem"
            type="button"
          >
            <Icon name="logout" size={17} />
            {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
