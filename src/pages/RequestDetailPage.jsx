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

  if (cargando) return <PageLoader label="Cargando la solicitud…" />
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

  const datosProducto = [
    { etiqueta: 'Modelo', valor: detalle.modelo },
    { etiqueta: 'SKU', valor: detalle.sku },
    { etiqueta: 'Número de serie', valor: detalle.numeroSerie },
    { etiqueta: 'IMEI', valor: detalle.imei },
    { etiqueta: 'Accesorios', valor: detalle.accesorios, ancho: true },
    { etiqueta: 'Descripción', valor: detalle.descripcion, ancho: true },
    { etiqueta: 'Observaciones', valor: detalle.observaciones, ancho: true },
  ].filter((dato) => dato.valor)

  const totalEvidencias = detalle.evidencias.length
  const seguimientoVisible = detalle.seguimiento.filter(
    (evento) => evento.titulo !== 'Estado actual',
  )

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
              <h2>Datos del producto</h2>
            </div>
          </div>
          {datosProducto.length > 0 ? (
            <dl className="review-grid">
              {datosProducto.map((dato) => (
                <div className={dato.ancho ? 'review-wide' : undefined} key={dato.etiqueta}>
                  <dt>{dato.etiqueta}</dt>
                  <dd>{dato.valor}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="panel-note">Sin datos adicionales.</p>
          )}
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
          {seguimientoVisible.length > 0 ? (
            <ol className="timeline">
              {seguimientoVisible.map((evento, indice) => (
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
          ) : (
            <p className="panel-note">Sin movimientos adicionales.</p>
          )}
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
            <p className="card-kicker">Archivos privados</p>
            <h2>Evidencias</h2>
          </div>
          <span className="badge badge-neutral">
            {totalEvidencias} {totalEvidencias === 1 ? 'archivo' : 'archivos'}
          </span>
        </div>
        {totalEvidencias === 0 ? (
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
            <Icon name="info" size={16} /> El certificado se habilitará cuando esté disponible.
          </p>
        ) : null}
      </section>

      <Link className="back-link" to="/app/solicitudes">
        <Icon name="arrow-left" size={16} /> Volver a Mis solicitudes
      </Link>
    </div>
  )
}
