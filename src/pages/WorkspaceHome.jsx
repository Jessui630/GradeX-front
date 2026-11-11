import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, InlineError, PageLoader } from '../components/PageState'
import { RequestCard } from '../components/RequestCard'
import { useAuth } from '../features/auth/auth-context'
import { ROLE, tieneRol } from '../features/auth/roles'
import { listarSolicitudes } from '../features/solicitudes/solicitudes.api'
import { mensajeDeError } from '../lib/errors'

export function WorkspaceHome() {
  const { usuario } = useAuth()
  const esSolicitante = tieneRol(usuario, ROLE.SOLICITANTE)
  const [recientes, setRecientes] = useState(null)
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(esSolicitante)
  const [errorSolicitudes, setErrorSolicitudes] = useState('')

  useEffect(() => {
    let activo = true
    if (!esSolicitante) return undefined

    listarSolicitudes({ pagina: 1, tamanoPagina: 3 })
      .then((resultado) => {
        if (activo) setRecientes(resultado)
      })
      .catch((error) => {
        if (activo) setErrorSolicitudes(mensajeDeError(error))
      })
      .finally(() => {
        if (activo) setCargandoSolicitudes(false)
      })

    return () => {
      activo = false
    }
  }, [esSolicitante])

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
          </section>

          <section aria-labelledby="recientes-titulo" className="section-block">
            <div className="section-heading section-heading-row">
              <h2 id="recientes-titulo">Últimas solicitudes</h2>
              <Link className="muted-link" to="/app/solicitudes">
                Ver todas
              </Link>
            </div>

            {errorSolicitudes ? <InlineError>{errorSolicitudes}</InlineError> : null}
            {cargandoSolicitudes ? (
              <PageLoader compact label="Cargando tus solicitudes…" />
            ) : !errorSolicitudes && !recientes?.elementos?.length ? (
              <EmptyState
                actionLabel="Crear mi primera evaluación"
                actionTo="/app/evaluaciones/nueva"
                compact
                description="Registra un producto y adjunta su evidencia."
                icon="box"
                title="Aún no tienes solicitudes"
              />
            ) : recientes?.elementos?.length ? (
              <div className="request-list">
                {recientes.elementos.map((solicitud) => (
                  <RequestCard key={solicitud.idSolicitud} solicitud={solicitud} />
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <EmptyState
          compact
          description="No hay módulos disponibles para tu rol por ahora."
          icon="lock"
          title="Tu cuenta está lista"
        />
      )}
    </div>
  )
}
