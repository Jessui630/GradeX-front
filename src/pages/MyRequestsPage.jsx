import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { EmptyState, InlineError, PageLoader } from '../components/PageState'
import { RequestCard } from '../components/RequestCard'
import { listarSolicitudes } from '../features/solicitudes/solicitudes.api'
import { mensajeDeError } from '../lib/errors'

const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'BORRADOR', etiqueta: 'Borradores' },
  { valor: 'PENDIENTE_ASIGNACION', etiqueta: 'Pendientes' },
]

export function MyRequestsPage() {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true

    listarSolicitudes({ pagina, tamanoPagina: 8, estado: estado || undefined })
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
  }, [pagina, estado])

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamanoPagina)) : 1

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h1>Mis solicitudes</h1>
          <p>Consulta el estado de tus evaluaciones.</p>
        </div>
        <Link className="button button-primary" to="/app/evaluaciones/nueva">
          <Icon name="spark" size={18} /> Nueva evaluación
        </Link>
      </header>

      <div className="filter-bar" role="group" aria-label="Filtrar solicitudes por estado">
        {FILTROS.map((filtro) => (
          <button
            aria-pressed={estado === filtro.valor}
            className={`filter-chip${estado === filtro.valor ? ' is-active' : ''}`}
            key={filtro.valor}
            onClick={() => {
              setCargando(true)
              setError('')
              setEstado(filtro.valor)
              setPagina(1)
            }}
            type="button"
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {error ? <InlineError>{error}</InlineError> : null}

      {cargando ? (
        <PageLoader compact label="Cargando tus solicitudes…" />
      ) : !datos?.elementos?.length ? (
        <EmptyState
          actionLabel="Crear mi primera evaluación"
          actionTo="/app/evaluaciones/nueva"
          compact
          description="Registra un producto y adjunta su evidencia."
          icon="clipboard"
          title={estado ? 'No hay solicitudes con este filtro' : 'Aún no tienes solicitudes'}
        />
      ) : (
        <>
          <div className="request-list">
            {datos.elementos.map((solicitud) => (
              <RequestCard key={solicitud.idSolicitud} solicitud={solicitud} />
            ))}
          </div>
          <nav aria-label="Paginación de solicitudes" className="pagination">
            <button
              className="button button-secondary"
              disabled={pagina <= 1}
              onClick={() => {
                setCargando(true)
                setError('')
                setPagina((actual) => Math.max(1, actual - 1))
              }}
              type="button"
            >
              <Icon name="arrow-left" size={16} /> Anterior
            </button>
            <span>
              Página {datos.pagina} de {totalPaginas} · {datos.total} solicitud
              {datos.total === 1 ? '' : 'es'}
            </span>
            <button
              className="button button-secondary"
              disabled={pagina >= totalPaginas}
              onClick={() => {
                setCargando(true)
                setError('')
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
