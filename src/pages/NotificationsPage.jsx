import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, PageLoader } from '../components/PageState'
import { useAuth } from '../features/auth/auth-context'
import { ROLE, tieneRol } from '../features/auth/roles'
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from '../features/notificaciones/notificaciones.api'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

export function NotificationsPage() {
  const { usuario } = useAuth()
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [marcando, setMarcando] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarNotificaciones({ pagina, tamanoPagina: 20, soloNoLeidas })
      .then((resultado) => {
        if (activo) setDatos(resultado)
      })
      .catch((fallo) => {
        if (activo) setError(mensajeDeError(fallo))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [pagina, soloNoLeidas, intento])

  async function marcar(idNotificacion) {
    setMarcando(true)
    setCargando(true)
    try {
      await marcarLeida(idNotificacion)
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setMarcando(false)
    }
  }

  async function marcarTodas() {
    setMarcando(true)
    setCargando(true)
    try {
      await marcarTodasLeidas()
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setMarcando(false)
    }
  }

  function enlaceSolicitud(notificacion) {
    if (!notificacion.idSolicitud) return null
    const esAvisoDeAsignacion =
      notificacion.titulo === 'Nueva solicitud asignada' ||
      notificacion.tipoCodigo === 'EVIDENCIA_RECIBIDA'
    if (esAvisoDeAsignacion && tieneRol(usuario, ROLE.ESPECIALISTA)) {
      return `/app/especialista/asignaciones/${notificacion.idSolicitud}`
    }
    if (tieneRol(usuario, ROLE.SOLICITANTE)) {
      return `/app/solicitudes/${notificacion.idSolicitud}`
    }
    if (tieneRol(usuario, ROLE.ESPECIALISTA)) {
      return `/app/especialista/asignaciones/${notificacion.idSolicitud}`
    }
    return null
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamanoPagina)) : 1

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Avisos</p>
          <h1>Notificaciones</h1>
          <p>Cambios de estado, evidencia y certificados de tus solicitudes.</p>
        </div>
        <button
          className="button button-secondary"
          disabled={marcando || !datos?.noLeidas}
          onClick={marcarTodas}
          type="button"
        >
          <Icon name="check" size={16} /> Marcar todas como leídas
        </button>
      </header>

      <div className="filter-bar" role="group" aria-label="Filtrar notificaciones">
        <button
          aria-pressed={!soloNoLeidas}
          className={`filter-chip${!soloNoLeidas ? ' is-active' : ''}`}
          onClick={() => {
            setCargando(true)
            setSoloNoLeidas(false)
            setPagina(1)
          }}
          type="button"
        >
          Todas
        </button>
        <button
          aria-pressed={soloNoLeidas}
          className={`filter-chip${soloNoLeidas ? ' is-active' : ''}`}
          onClick={() => {
            setCargando(true)
            setSoloNoLeidas(true)
            setPagina(1)
          }}
          type="button"
        >
          No leídas {datos?.noLeidas ? `(${datos.noLeidas})` : ''}
        </button>
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      {cargando ? (
        <PageLoader compact label="Cargando notificaciones…" />
      ) : !datos?.elementos?.length ? (
        <EmptyState
          compact
          description="Cuando haya un cambio en tus solicitudes aparecerá aquí."
          icon="bell"
          title="Sin notificaciones"
        />
      ) : (
        <>
          <ul className="notification-list">
            {datos.elementos.map((notificacion) => {
              const enlace = enlaceSolicitud(notificacion)
              return (
                <li
                  className={`notification-item${notificacion.leida ? '' : ' is-unread'}`}
                  key={notificacion.idNotificacion}
                >
                  <span className="notification-icon">
                    <Icon name="bell" size={18} />
                  </span>
                  <div>
                    <strong>{notificacion.titulo}</strong>
                    <p>{notificacion.mensaje}</p>
                    <small>{formatearFecha(notificacion.fechaCreacion)}</small>
                    {enlace ? (
                      <Link className="muted-link" to={enlace}>
                        Ver solicitud <Icon name="arrow-right" size={14} />
                      </Link>
                    ) : null}
                  </div>
                  {!notificacion.leida ? (
                    <button
                      className="button button-quiet"
                      disabled={marcando}
                      onClick={() => marcar(notificacion.idNotificacion)}
                      type="button"
                    >
                      Marcar leída
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <nav aria-label="Paginación de notificaciones" className="pagination">
            <button
              className="button button-secondary"
              disabled={pagina <= 1}
              onClick={() => {
                setCargando(true)
                setPagina((actual) => Math.max(1, actual - 1))
              }}
              type="button"
            >
              <Icon name="arrow-left" size={16} /> Anterior
            </button>
            <span>Página {datos.pagina} de {totalPaginas} · {datos.total} avisos</span>
            <button
              className="button button-secondary"
              disabled={pagina >= totalPaginas}
              onClick={() => {
                setCargando(true)
                setPagina((actual) => actual + 1)
              }}
              type="button"
            >
              Siguiente <Icon name="arrow-right" size={16} />
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
