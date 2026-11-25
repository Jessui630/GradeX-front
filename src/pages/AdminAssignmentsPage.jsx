import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { EmptyState, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import {
  asignarEspecialista,
  listarSolicitudesAsignacion,
  obtenerSolicitudAsignacion,
} from '../features/administracion/administracion.api'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

const FILTROS = [
  { valor: 'PENDIENTE_ASIGNACION', etiqueta: 'Pendientes' },
  { valor: 'ASIGNADA', etiqueta: 'Asignadas' },
  { valor: 'EN_EVALUACION', etiqueta: 'En evaluación' },
  { valor: 'FALTA_EVIDENCIA', etiqueta: 'Falta evidencia' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizadas' },
  { valor: '', etiqueta: 'Todas' },
]

export function AdminAssignmentsPage() {
  const [estado, setEstado] = useState('PENDIENTE_ASIGNACION')
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [asignando, setAsignando] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarSolicitudesAsignacion({ pagina, tamanoPagina: 8, estado: estado || undefined })
      .then((resultado) => {
        if (!activo) return
        setDatos(resultado)
        setSeleccionada(resultado.elementos[0]?.idSolicitud ?? null)
        setDetalle(null)
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
  }, [estado, pagina, intento])

  useEffect(() => {
    let activo = true
    if (!seleccionada) return undefined
    obtenerSolicitudAsignacion(seleccionada)
      .then((resultado) => {
        if (activo) setDetalle(resultado)
      })
      .catch((fallo) => {
        if (activo) setError(mensajeDeError(fallo))
      })
    return () => {
      activo = false
    }
  }, [seleccionada, intento])

  function seleccionar(idSolicitud) {
    if (idSolicitud === seleccionada) return
    setSeleccionada(idSolicitud)
    setDetalle(null)
    setMensaje('')
    setError('')
  }

  async function asignar(idEspecialista) {
    if (!seleccionada) return
    setAsignando(idEspecialista)
    setError('')
    setMensaje('')
    try {
      const creada = await asignarEspecialista(seleccionada, idEspecialista)
      setMensaje(`Solicitud asignada a ${creada.especialista}.`)
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setAsignando(null)
    }
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamanoPagina)) : 1

  return (
    <div className="admin-section">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Asignación de solicitudes</h1>
          <p>Selecciona un especialista compatible y registra la asignación.</p>
        </div>
      </header>

      <div className="filter-bar" role="group" aria-label="Filtrar solicitudes">
        {FILTROS.map((filtro) => (
          <button
            aria-pressed={estado === filtro.valor}
            className={`filter-chip${estado === filtro.valor ? ' is-active' : ''}`}
            key={filtro.valor}
            onClick={() => {
              setCargando(true)
              setEstado(filtro.valor)
              setPagina(1)
              setMensaje('')
              setError('')
              setSeleccionada(null)
              setDetalle(null)
            }}
            type="button"
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      {mensaje ? <div className="alert alert-success" role="status">{mensaje}</div> : null}

      {cargando ? (
        <PageLoader compact label="Cargando solicitudes…" />
      ) : !datos?.elementos?.length ? (
        <EmptyState
          compact
          description="No hay solicitudes con este filtro."
          icon="clipboard"
          title="Sin solicitudes"
        />
      ) : (
        <div className="admin-split">
          <div className="request-list">
            {datos.elementos.map((solicitud) => (
              <button
                className={`request-card admin-request-select${seleccionada === solicitud.idSolicitud ? ' is-selected' : ''}`}
                key={solicitud.idSolicitud}
                onClick={() => seleccionar(solicitud.idSolicitud)}
                type="button"
              >
                <div className="request-card-main">
                  <div className="request-card-top">
                    <span className="request-folio">{solicitud.folio}</span>
                    <StatusBadge codigo={solicitud.estadoCodigo} />
                  </div>
                  <h3>{solicitud.nombreProducto}</h3>
                  <p>
                    {solicitud.categoria}
                    {solicitud.marca ? ` · ${solicitud.marca}` : ''}
                  </p>
                  <span className="request-action">
                    <Icon name="users" size={15} /> {solicitud.especialistasCompatibles} compatibles
                  </span>
                </div>
                <div className="request-card-meta">
                  <span>{formatearFecha(solicitud.fechaSolicitud)}</span>
                  <span className="request-card-arrow"><Icon name="arrow-right" size={18} /></span>
                </div>
              </button>
            ))}
          </div>

          <section className="panel-card admin-detail">
            {!detalle ? (
              <PageLoader compact label="Cargando detalle…" />
            ) : (
              <>
                <div className="panel-card-heading">
                  <span className="feature-icon"><Icon name="clipboard" size={22} /></span>
                  <div>
                    <p className="card-kicker">{detalle.folio}</p>
                    <h2>{detalle.nombreProducto}</h2>
                  </div>
                  <StatusBadge codigo={detalle.estadoCodigo} />
                </div>
                <dl className="review-grid">
                  <div><dt>Categoría</dt><dd>{detalle.categoria}</dd></div>
                  <div><dt>Marca</dt><dd>{detalle.marca ?? 'Sin marca'}</dd></div>
                  <div><dt>Modelo</dt><dd>{detalle.modelo ?? 'No indicado'}</dd></div>
                  <div><dt>Fecha</dt><dd>{formatearFecha(detalle.fechaSolicitud)}</dd></div>
                </dl>

                {detalle.asignacion ? (
                  <div className="alert alert-success">
                    <Icon name="check" size={18} />
                    Asignada a {detalle.asignacion.especialista} el{' '}
                    {formatearFecha(detalle.asignacion.fechaAsignacion)}.
                  </div>
                ) : null}

                {detalle.puedeAsignarse ? (
                  <>
                    <h3>Especialistas compatibles</h3>
                    {detalle.especialistasCompatibles.length === 0 ? (
                      <div className="alert alert-error">
                        No hay especialistas activos compatibles con esta categoría y marca.
                        Revisa la gestión de especialistas.
                      </div>
                    ) : (
                      <ul className="compatible-list">
                        {detalle.especialistasCompatibles.map((especialista) => (
                          <li key={especialista.idEspecialista}>
                            <div>
                              <strong>{especialista.nombre}</strong>
                              <p>
                                {especialista.nivel}
                                {especialista.aniosExperiencia
                                  ? ` · ${especialista.aniosExperiencia} años`
                                  : ''}
                                {` · ${especialista.cargaActiva} asignaciones activas`}
                                {especialista.coincideMarca ? ' · coincide marca' : ''}
                              </p>
                            </div>
                            <button
                              className="button button-primary"
                              disabled={asignando === especialista.idEspecialista}
                              onClick={() => asignar(especialista.idEspecialista)}
                              type="button"
                            >
                              {asignando === especialista.idEspecialista ? (
                                <><span className="spinner spinner-small" /> Asignando…</>
                              ) : (
                                <>Asignar <Icon name="arrow-right" size={16} /></>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}

      {datos ? (
        <nav aria-label="Paginación de solicitudes" className="pagination">
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
          <span>Página {datos.pagina} de {totalPaginas} · {datos.total} solicitudes</span>
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
      ) : null}
    </div>
  )
}
