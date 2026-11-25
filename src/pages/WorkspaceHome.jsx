import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, ErrorState, PageLoader } from '../components/PageState'
import { RequestCard } from '../components/RequestCard'
import { useAuth } from '../features/auth/auth-context'
import { ROLE, tieneRol } from '../features/auth/roles'
import { listarSolicitudes } from '../features/solicitudes/solicitudes.api'

export function WorkspaceHome() {
  const { usuario } = useAuth()
  const esSolicitante = tieneRol(usuario, ROLE.SOLICITANTE)
  const esEspecialista = tieneRol(usuario, ROLE.ESPECIALISTA)
  const esAdministrador = tieneRol(usuario, ROLE.ADMINISTRADOR)
  const [recientes, setRecientes] = useState(null)
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(esSolicitante)
  const [errorSolicitudes, setErrorSolicitudes] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    if (!esSolicitante) return undefined

    listarSolicitudes({ pagina: 1, tamanoPagina: 3 })
      .then((resultado) => {
        if (activo) setRecientes(resultado)
      })
      .catch((error) => {
        if (!activo) return
        console.error('No se pudieron cargar las solicitudes recientes.', error)
        setErrorSolicitudes(true)
      })
      .finally(() => {
        if (activo) setCargandoSolicitudes(false)
      })

    return () => {
      activo = false
    }
  }, [esSolicitante, intento])

  function reintentar() {
    setErrorSolicitudes(false)
    setRecientes(null)
    setCargandoSolicitudes(true)
    setIntento((actual) => actual + 1)
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Resumen</p>
          <h1>Hola, {usuario?.nombreCompleto?.split(' ')[0] ?? 'bienvenido'}.</h1>
          <p>Este es el resumen de tus evaluaciones.</p>
        </div>
      </header>

      {esSolicitante ? (
        <>
          <section className="quick-actions" aria-label="Acciones principales">
            <Link className="quick-action quick-action-primary" to="/app/evaluaciones/nueva">
              <span className="quick-action-icon">
                <Icon name="spark" size={23} />
              </span>
              <span>
                <strong>Nueva evaluación</strong>
                <small>Registra un producto y adjunta su evidencia.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link className="quick-action" to="/app/solicitudes">
              <span className="quick-action-icon">
                <Icon name="clipboard" size={23} />
              </span>
              <span>
                <strong>Mis solicitudes</strong>
                <small>Revisa el estado de tus evaluaciones.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link className="quick-action" to="/app/certificados">
              <span className="quick-action-icon">
                <Icon name="certificate" size={23} />
              </span>
              <span>
                <strong>Mis certificados</strong>
                <small>Consulta y comparte los resultados emitidos.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
          </section>

          <section aria-labelledby="recientes-titulo" className="section-block">
            <div className="section-heading section-heading-row">
              <h2 id="recientes-titulo">Últimas solicitudes</h2>
              <Link className="muted-link" to="/app/solicitudes">
                Ver todas
              </Link>
            </div>

            {errorSolicitudes ? (
              <ErrorState
                description="Intenta de nuevo en unos momentos."
                onAction={reintentar}
                title="No pudimos cargar tus solicitudes"
              />
            ) : cargandoSolicitudes ? (
              <PageLoader compact label="Cargando tus solicitudes…" />
            ) : !recientes?.elementos?.length ? (
              <EmptyState
                actionLabel="Crear evaluación"
                actionTo="/app/evaluaciones/nueva"
                compact
                description="Cuando hagas tu primera evaluación, aparecerá aquí."
                icon="box"
                title="Aún no tienes solicitudes"
              />
            ) : (
              <div className="request-list">
                {recientes.elementos.map((solicitud) => (
                  <RequestCard key={solicitud.idSolicitud} solicitud={solicitud} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="quick-actions" aria-label="Acciones principales">
            {esEspecialista ? (
              <Link className="quick-action quick-action-primary" to="/app/especialista">
                <span className="quick-action-icon">
                  <Icon name="clipboard" size={23} />
                </span>
                <span>
                  <strong>Mis asignaciones</strong>
                  <small>Revisa las evaluaciones que tienes en curso.</small>
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            ) : null}
            {esAdministrador ? (
              <Link className="quick-action quick-action-primary" to="/app/administracion">
                <span className="quick-action-icon">
                  <Icon name="settings" size={23} />
                </span>
                <span>
                  <strong>Panel administrativo</strong>
                  <small>Gestiona asignaciones, especialistas y catálogo.</small>
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            ) : null}
            <Link className="quick-action" to="/app/notificaciones">
              <span className="quick-action-icon">
                <Icon name="bell" size={23} />
              </span>
              <span>
                <strong>Notificaciones</strong>
                <small>Consulta los cambios de tus procesos.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
          </section>
          {!esEspecialista && !esAdministrador ? (
            <EmptyState
              compact
              description="No hay módulos disponibles para tu rol por ahora."
              icon="lock"
              title="Tu cuenta está lista"
            />
          ) : null}
        </>
      )}
    </div>
  )
}
