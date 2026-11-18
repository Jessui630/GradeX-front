import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, ErrorState, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import { listarAsignaciones } from '../features/especialista/especialista.api'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'ASIGNADA', etiqueta: 'Asignadas' },
  { valor: 'EN_EVALUACION', etiqueta: 'En evaluación' },
  { valor: 'FALTA_EVIDENCIA', etiqueta: 'Falta evidencia' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizadas' },
]

export function SpecialistAssignmentsPage() {
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarAsignaciones({ pagina, tamanoPagina: 10, estado: estado || undefined })
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
  }, [pagina, estado, intento])

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamanoPagina)) : 1

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Especialista</p>
          <h1>Mis asignaciones</h1>
          <p>Evaluaciones asignadas a tu perfil acreditado.</p>
        </div>
        <Link className="button button-quiet" to="/app/notificaciones">
          <Icon name="bell" size={17} /> Notificaciones
        </Link>
      </header>

      <div className="filter-bar" role="group" aria-label="Filtrar asignaciones">
        {FILTROS.map((filtro) => (
          <button
            aria-pressed={estado === filtro.valor}
            className={`filter-chip${estado === filtro.valor ? ' is-active' : ''}`}
            key={filtro.valor}
            onClick={() => {
              setCargando(true)
              setEstado(filtro.valor)
              setPagina(1)
            }}
            type="button"
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState
          description="No pudimos obtener tus asignaciones."
          onAction={() => {
            setCargando(true)
            setIntento((actual) => actual + 1)
          }}
          title="Error al cargar asignaciones"
        />
      ) : cargando ? (
        <PageLoader compact label="Cargando asignaciones…" />
      ) : !datos?.elementos?.length ? (
        <EmptyState
          compact
          description="Cuando un administrador te asigne una solicitud aparecerá aquí."
          icon="clipboard"
          title="No tienes asignaciones con este filtro"
        />
      ) : (
        <>
          <div className="request-list">
            {datos.elementos.map((asignacion) => (
              <Link
                className="request-card"
                key={asignacion.idSolicitud}
                to={`/app/especialista/asignaciones/${asignacion.idSolicitud}`}
              >
                <div className="request-card-main">
                  <div className="request-card-top">
                    <span className="request-folio">{asignacion.folio}</span>
                    <StatusBadge codigo={asignacion.estadoCodigo} />
                  </div>
                  <h3>{asignacion.nombreProducto}</h3>
                  <p>
                    {asignacion.categoria}
                    {asignacion.marca ? ` · ${asignacion.marca}` : ''}
                  </p>
                  <span className="request-action">
                    <Icon name="clock" size={15} />
                    Asignada {formatearFecha(asignacion.fechaAsignacion)}
                  </span>
                </div>
                <div className="request-card-meta">
                  <span>
                    <Icon name="certificate" size={15} /> {asignacion.evidenciasActivas} evidencia
                    {asignacion.evidenciasActivas === 1 ? '' : 's'}
                  </span>
                  <span>
                    {asignacion.evaluacionIniciada ? 'Evaluación iniciada' : 'Sin evaluación'}
                  </span>
                  <span className="request-card-arrow">
                    <Icon name="arrow-right" size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <nav aria-label="Paginación de asignaciones" className="pagination">
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
            <span>
              Página {datos.pagina} de {totalPaginas} · {datos.total} asignación
              {datos.total === 1 ? '' : 'es'}
            </span>
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
