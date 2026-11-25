import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CertificateQr } from '../components/CertificateQr'
import { EvidencePreview } from '../components/EvidencePreview'
import { Icon } from '../components/Icon'
import { InlineError, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import { obtenerRequisitos } from '../features/catalog/catalog.api'
import {
  etiquetaDictamen,
  formatearCalificacion,
  tonoDictamen,
} from '../features/certificados/certificadoFormato'
import { obtenerCertificadoSolicitud } from '../features/certificados/certificados.api'
import { obtenerSolicitud, subirEvidencia } from '../features/solicitudes/solicitudes.api'
import { formatearFecha, formatearTamano } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

function valorResultado(resultado) {
  if (resultado.valorTexto) return resultado.valorTexto
  if (resultado.valorNumerico !== null && resultado.valorNumerico !== undefined) {
    return String(resultado.valorNumerico)
  }
  if (resultado.valorBooleano !== null && resultado.valorBooleano !== undefined) {
    return resultado.valorBooleano ? 'Sí' : 'No'
  }
  return 'Sin valor'
}

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
  const [certificado, setCertificado] = useState(null)
  const [requisitos, setRequisitos] = useState(null)
  const [idTipoEvidencia, setIdTipoEvidencia] = useState('')
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [errorEvidencia, setErrorEvidencia] = useState('')
  const [mensajeEvidencia, setMensajeEvidencia] = useState('')
  const [mensajeCertificado, setMensajeCertificado] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    if (invalida) return undefined

    obtenerSolicitud(idSolicitud)
      .then((resultado) => {
        if (!activo) return
        setDetalle(resultado)
        setCertificado(null)
        if (resultado.estadoCodigo !== 'FALTA_EVIDENCIA') setRequisitos(null)
        if (resultado.estadoCodigo === 'FINALIZADA') {
          return obtenerCertificadoSolicitud(idSolicitud)
            .then((certificadoData) => {
              if (activo) setCertificado(certificadoData)
            })
            .catch((fallo) => {
              if (activo && fallo?.status !== 404) {
                setError(mensajeDeError(fallo))
              }
            })
        }
        return undefined
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
  }, [idSolicitud, invalida, intento])

  useEffect(() => {
    let activo = true
    if (!detalle || detalle.estadoCodigo !== 'FALTA_EVIDENCIA') {
      return undefined
    }
    obtenerRequisitos(detalle.idCategoria)
      .then((data) => {
        if (!activo) return
        setRequisitos(data)
        const disponibles = (data.evidencias ?? []).filter((tipo) => {
          const activas = detalle.evidencias.filter(
            (evidencia) => evidencia.idTipoEvidencia === tipo.idTipoEvidencia,
          ).length
          return activas < Math.max(1, tipo.cantidadMaxima)
        })
        setIdTipoEvidencia((actual) =>
          disponibles.some((tipo) => String(tipo.idTipoEvidencia) === actual)
            ? actual
            : String(disponibles[0]?.idTipoEvidencia ?? ''))
      })
      .catch((fallo) => {
        if (activo) setErrorEvidencia(mensajeDeError(fallo))
      })
    return () => {
      activo = false
    }
  }, [detalle])

  async function enviarEvidenciaAdicional(evento) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    if (!idTipoEvidencia ||
      !tiposEvidenciaDisponibles.some(
        (tipo) => String(tipo.idTipoEvidencia) === String(idTipoEvidencia),
      )) {
      setErrorEvidencia('Selecciona un tipo de evidencia con capacidad disponible.')
      return
    }
    const archivo = formulario.elements.namedItem('archivo')?.files?.[0]
    if (!archivo) {
      setErrorEvidencia('Selecciona una imagen.')
      return
    }
    setSubiendo(true)
    setErrorEvidencia('')
    setMensajeEvidencia('')
    try {
      await subirEvidencia(
        idSolicitud,
        Number(idTipoEvidencia),
        archivo,
        descripcionEvidencia.trim() || undefined,
      )
      setMensajeEvidencia('Evidencia adicional enviada. La evaluación continuará.')
      setDescripcionEvidencia('')
      formulario.reset()
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setErrorEvidencia(mensajeDeError(fallo))
    } finally {
      setSubiendo(false)
    }
  }

  async function copiarEnlace() {
    if (!certificado?.qrToken) return
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/verificar/${certificado.qrToken}`,
      )
      setMensajeCertificado('Enlace de verificación copiado.')
    } catch {
      setMensajeCertificado('No fue posible copiar el enlace. Usa el botón de verificación.')
    }
  }

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
  const tiposEvidenciaDisponibles = (requisitos?.evidencias ?? []).filter((tipo) => {
    const activas = detalle.evidencias.filter(
      (evidencia) => evidencia.idTipoEvidencia === tipo.idTipoEvidencia,
    ).length
    return activas < Math.max(1, tipo.cantidadMaxima)
  })
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

      {mensajeEvidencia ? (
        <div className="alert alert-success" role="status">{mensajeEvidencia}</div>
      ) : null}

      {detalle.estadoCodigo === 'FALTA_EVIDENCIA' ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="alert" size={22} /></span>
            <div>
              <p className="card-kicker">Evidencia adicional</p>
              <h2>El especialista solicitó más información</h2>
            </div>
          </div>
          <p className="panel-note">
            {detalle.evidenciaAdicionalSolicitada
              ?? 'Adjunta la evidencia adicional para continuar con la evaluación.'}
          </p>
          {errorEvidencia ? <InlineError>{errorEvidencia}</InlineError> : null}
          <form className="form-grid" onSubmit={enviarEvidenciaAdicional}>
            <div className="field">
              <label htmlFor="tipoEvidenciaAdicional">Tipo de evidencia</label>
              <select
                id="tipoEvidenciaAdicional"
                onChange={(evento) => setIdTipoEvidencia(evento.target.value)}
                value={idTipoEvidencia}
              >
                <option value="">Selecciona</option>
                {tiposEvidenciaDisponibles.map((tipo) => (
                  <option key={tipo.idTipoEvidencia} value={tipo.idTipoEvidencia}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {tiposEvidenciaDisponibles.length === 0 ? (
                <p className="field-error" role="alert">
                  No hay tipos de evidencia con capacidad disponible. Contacta al especialista.
                </p>
              ) : null}
            </div>
            <div className="field field-wide">
              <label htmlFor="archivoEvidenciaAdicional">Imagen (JPG, PNG o WEBP, máximo 8 MB)</label>
              <input
                accept="image/jpeg,image/png,image/webp"
                id="archivoEvidenciaAdicional"
                name="archivo"
                required
                type="file"
              />
            </div>
            <div className="field field-wide">
              <label htmlFor="descripcionEvidenciaAdicional">Descripción (opcional)</label>
              <input
                id="descripcionEvidenciaAdicional"
                maxLength={500}
                onChange={(evento) => setDescripcionEvidencia(evento.target.value)}
                value={descripcionEvidencia}
              />
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={subiendo} type="submit">
                {subiendo ? (
                  <><span className="spinner spinner-small" /> Enviando…</>
                ) : (
                  <><Icon name="certificate" size={17} /> Enviar evidencia</>
                )}
              </button>
            </div>
          </form>
        </section>
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
        {detalle.estadoCodigo === 'FINALIZADA' && !detalle.certificadoDisponible && !certificado ? (
          <p className="detail-footnote">
            <Icon name="info" size={16} /> El certificado se habilitará cuando el especialista lo emita.
          </p>
        ) : null}
      </section>

      {detalle.resultadosEvaluacion?.length ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="clipboard" size={22} /></span>
            <div>
              <p className="card-kicker">Evaluación</p>
              <h2>Resultados por criterio</h2>
            </div>
          </div>
          <dl className="review-grid">
            {detalle.resultadosEvaluacion.map((resultado) => (
              <div className="review-wide" key={resultado.idCriterio}>
                <dt>{resultado.nombre}</dt>
                <dd>
                  {valorResultado(resultado)}
                  {resultado.observacion ? ` · ${resultado.observacion}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {certificado ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="certificate" size={22} /></span>
            <div>
              <p className="card-kicker">Certificado</p>
              <h2>{certificado.numeroCertificado}</h2>
            </div>
            <span className="badge badge-success">{certificado.estadoNombre}</span>
          </div>
          <div className={`certificate-result certificate-result-${tonoDictamen(certificado.dictamen)}`}>
            <span>Resultado de la evaluación</span>
            <strong>{etiquetaDictamen(certificado.dictamen)}</strong>
          </div>
          <dl className="review-grid">
            <div><dt>Modelo</dt><dd>{certificado.modelo ?? detalle.modelo ?? 'No indicado'}</dd></div>
            <div><dt>Condición</dt><dd>{formatearCalificacion(certificado.conditionGrade)}</dd></div>
            <div><dt>Emisión</dt><dd>{formatearFecha(certificado.fechaEmision)}</dd></div>
            <div><dt>Vigencia</dt><dd>{certificado.estadoNombre}</dd></div>
            <div className="review-wide">
              <dt>Especialista</dt>
              <dd>{certificado.especialista ?? detalle.especialista?.nombre ?? 'No disponible'}</dd>
            </div>
            <div className="review-wide">
              <dt>Especialidad</dt>
              <dd>{certificado.especialidad ?? 'No disponible'}</dd>
            </div>
          </dl>
          <CertificateQr token={certificado.qrToken} />
          <p className="panel-note">
            El enlace público muestra el dictamen y los datos del producto, sin información
            personal del solicitante. Un dictamen No auténtico o Inconcluso no acredita la
            autenticidad del producto.
          </p>
          {mensajeCertificado ? (
            <div className="alert alert-success" role="status">{mensajeCertificado}</div>
          ) : null}
          <div className="hero-actions">
            <Link className="button button-primary" to={`/verificar/${certificado.qrToken}`}>
              <Icon name="shield" size={17} /> Verificar certificado
            </Link>
            <button className="button button-secondary" onClick={copiarEnlace} type="button">
              <Icon name="external-link" size={17} /> Copiar enlace
            </button>
            <button className="button button-quiet" onClick={() => window.print()} type="button">
              <Icon name="download" size={17} /> Imprimir / guardar PDF
            </button>
          </div>
        </section>
      ) : null}

      <Link className="back-link" to="/app/solicitudes">
        <Icon name="arrow-left" size={16} /> Volver a Mis solicitudes
      </Link>
    </div>
  )
}
