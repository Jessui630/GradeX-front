import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, InlineError, PageLoader } from '../components/PageState'
import { RequestCard } from '../components/RequestCard'
import { useAuth } from '../features/auth/auth-context'
import { etiquetaRol, ROLE, tieneRol } from '../features/auth/roles'
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
        </div>
        <span className="role-pill">
          <Icon name="shield" size={16} />
          {usuario?.roles?.map(etiquetaRol).join(' · ')}
        </span>
      </header>

      {esSolicitante ? (
        <>
          <section className="quick-actions" aria-label="Acciones principales">
            <Link className="quick-action quick-action-primary" to="/app/evaluaciones/nueva">
              <span className="quick-action-icon"><Icon name="spark" size={23} /></span>
              <span>
                <strong>Nueva evaluación</strong>
                <small>Registra un producto y adjunta evidencia.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link className="quick-action" to="/app/solicitudes">
              <span className="quick-action-icon"><Icon name="clipboard" size={23} /></span>
              <span>
                <strong>Mis solicitudes</strong>
                <small>Consulta estado y seguimiento.</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
          </section>

          <section aria-labelledby="recientes-titulo" className="section-block">
            <div className="section-heading section-heading-row">
              <h2 id="recientes-titulo">Solicitudes recientes</h2>
              <Link className="muted-link" to="/app/solicitudes">Ver todas</Link>
            </div>

            {errorSolicitudes ? <InlineError>{errorSolicitudes}</InlineError> : null}
            {cargandoSolicitudes ? (
              <PageLoader label="Cargando solicitudes…" />
            ) : !errorSolicitudes && !recientes?.elementos?.length ? (
              <EmptyState
                description="Tus solicitudes aparecerán aquí."
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
          description="Las funciones de este rol se habilitarán cuando sus módulos estén implementados."
          icon="lock"
          title="Sin módulos disponibles por ahora"
        />
      )}

      <section className="panel-card account-card">
        <div className="panel-card-heading">
          <span className="feature-icon">
            <Icon name="user" size={22} />
          </span>
          <div>
            <p className="card-kicker">Cuenta</p>
            <h2>{usuario?.correo}</h2>
          </div>
        </div>
        <dl className="account-details">
          <div>
            <dt>Roles</dt>
            <dd>{usuario?.roles?.map(etiquetaRol).join(', ')}</dd>
          </div>
          <div>
            <dt>Sesión</dt>
            <dd>Persistida en SQL Server</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>Activa y protegida con cookie HttpOnly</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
