import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EvidencePreview } from '../components/EvidencePreview'
import { Icon } from '../components/Icon'
import { InlineError, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import { obtenerSolicitud } from '../features/solicitudes/solicitudes.api'
import { formatearFecha, formatearTamano } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

export function RequestDetailRoute() {
  const { id } = useParams()
  return <RequestDetailPage id={id} key={id ?? 'invalida'} />
}

export function RequestDetailPage({ id }) {
  const idSolicitud = Number(id)
  const invalida = !Number.isInteger(idSolicitud) || idSolicitud <= 0
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(!invalida)
  const [error, setError] = useState(invalida ? 'La solicitud indicada no es válida.' : '')

  useEffect(() => {
    let activo = true
    if (invalida) return undefined

    obtenerSolicitud(idSolicitud)
      .then((resultado) => {
        if (activo) setDetalle(resultado)
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
  }, [idSolicitud, invalida])

  if (cargando) return <PageLoader label="Consultando el seguimiento…" />
  if (error) {
    return (
      <div className="workspace-page">
        <InlineError>{error}</InlineError>
        <Link className="button button-secondary" to="/app/solicitudes">
          <Icon name="arrow-left" size={16} /> Volver a Mis solicitudes
        </Link>
      </div>
    )
  }
  if (!detalle) return null

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Solicitud {detalle.folio}</p>
          <h1>{detalle.nombreProducto}</h1>
          <p>
            {detalle.categoria}
            {detalle.marca ? ` · ${detalle.marca}` : ''} · {formatearFecha(detalle.fechaSolicitud)}
          </p>
        </div>
        <div className="detail-status">
          <StatusBadge codigo={detalle.estadoCodigo} />
          {detalle.esBorrador ? (
            <Link className="button button-primary" to={`/app/evaluaciones/nueva?borrador=${detalle.idSolicitud}`}>
              Continuar borrador
              <Icon name="arrow-right" size={17} />
            </Link>
          ) : null}
        </div>
      </header>

      {detalle.accionPendiente ? (
        <div className="action-banner">
          <span className="feature-icon">
            <Icon name="clock" size={22} />
          </span>
          <div>
            <p className="card-kicker">Acción pendiente</p>
            <p>{detalle.accionPendiente}</p>
          </div>
        </div>
      ) : null}

      <div className="detail-layout">
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="box" size={22} />
            </span>
            <div>
              <p className="card-kicker">Producto</p>
              <h2>Información registrada</h2>
            </div>
          </div>
          <dl className="review-grid">
            <div><dt>Modelo</dt><dd>{detalle.modelo || 'No indicado'}</dd></div>
            <div><dt>SKU</dt><dd>{detalle.sku || 'No indicado'}</dd></div>
            <div><dt>Número de serie</dt><dd>{detalle.numeroSerie || 'No indicado'}</dd></div>
            <div><dt>IMEI</dt><dd>{detalle.imei || 'No indicado'}</dd></div>
            <div className="review-wide"><dt>Accesorios</dt><dd>{detalle.accesorios || 'No indicado'}</dd></div>
            <div className="review-wide"><dt>Descripción</dt><dd>{detalle.descripcion || 'Sin descripción'}</dd></div>
            <div className="review-wide"><dt>Observaciones</dt><dd>{detalle.observaciones || 'Sin observaciones'}</dd></div>
          </dl>
        </section>

        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="clipboard" size={22} />
            </span>
            <div>
              <p className="card-kicker">Seguimiento</p>
              <h2>Estado del proceso</h2>
            </div>
          </div>
          <ol className="timeline">
            {detalle.seguimiento.map((evento, indice) => (
              <li key={`${evento.fecha}-${evento.titulo}-${indice}`}>
                <span className="timeline-dot" />
                <div>
                  <strong>{evento.titulo}</strong>
                  <small>{formatearFecha(evento.fecha)}</small>
                  {evento.detalle ? <p>{evento.detalle}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          {detalle.especialista ? (
            <p className="detail-footnote">
              <Icon name="users" size={17} /> Especialista asignado: {detalle.especialista.nombre}
            </p>
          ) : (
            <p className="detail-footnote">
              <Icon name="clock" size={17} /> Aún no hay especialista asignado.
            </p>
          )}
          {detalle.evaluacion ? (
            <p className="detail-footnote">
              <Icon name="certificate" size={17} /> Dictamen: {detalle.evaluacion.dictamen ?? 'En proceso'}
            </p>
          ) : null}
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-card-heading">
          <span className="feature-icon">
            <Icon name="certificate" size={22} />
          </span>
          <div>
            <p className="card-kicker">Evidencia privada</p>
            <h2>Fotografías de la solicitud</h2>
          </div>
          <span className="badge badge-neutral">{detalle.evidencias.length} archivo(s)</span>
        </div>
        {detalle.evidencias.length === 0 ? (
          <p className="panel-note">Todavía no hay evidencia adjunta.</p>
        ) : (
          <div className="evidence-grid evidence-grid-large">
            {detalle.evidencias.map((evidencia) => (
              <div className="evidence-detail" key={evidencia.idEvidencia}>
                <EvidencePreview evidencia={evidencia} idSolicitud={detalle.idSolicitud} />
                <div>
                  <strong>{evidencia.nombre}</strong>
                  {evidencia.descripcion ? <p>{evidencia.descripcion}</p> : null}
                  <small>
                    {evidencia.nombreOriginal ?? 'Archivo'} · {formatearTamano(evidencia.tamanoBytes)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
        {detalle.estadoCodigo === 'FINALIZADA' && !detalle.certificadoDisponible ? (
          <p className="detail-footnote">
            <Icon name="info" size={16} /> El certificado digital se habilitará cuando la HU-010
            esté implementada. Este detalle no genera certificados ficticios.
          </p>
        ) : null}
      </section>

      <Link className="back-link" to="/app/solicitudes">
        <Icon name="arrow-left" size={16} /> Volver a Mis solicitudes
      </Link>
    </div>
  )
}
