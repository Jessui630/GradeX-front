import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CertificateQr } from '../components/CertificateQr'
import { EvidencePreview } from '../components/EvidencePreview'
import { Icon } from '../components/Icon'
import { ErrorState, InlineError, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import { obtenerRequisitos } from '../features/catalog/catalog.api'
import {
  etiquetaDictamen,
  tonoDictamen,
} from '../features/certificados/certificadoFormato'
import {
  emitirCertificado,
  finalizarEvaluacion,
  guardarEvaluacion,
  obtenerArchivoEvidencia,
  obtenerAsignacion,
  solicitarEvidencia,
} from '../features/especialista/especialista.api'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

const DICTAMENES = [
  { valor: 'AUTENTICO', etiqueta: 'Auténtico' },
  { valor: 'NO_AUTENTICO', etiqueta: 'No auténtico' },
  { valor: 'INCONCLUSO', etiqueta: 'Inconcluso' },
]

const TIPOS_CRITERIO = {
  ESCALA: 'Escala',
  NUMERICO: 'Numérico',
  TEXTO: 'Texto',
  BOOLEANO: 'Sí / No',
}

function valorInicial(resultado, clave) {
  const valor = resultado?.[clave]
  if (valor === null || valor === undefined) return ''
  return String(valor)
}

function construirResultados(criterios, resultados) {
  return criterios
    .map((criterio) => {
      const actual = resultados[criterio.idCriterio] ?? {}
      const valorTexto = actual.valorTexto?.trim() || null
      const valorNumerico = actual.valorNumerico?.toString().trim()
        ? Number(actual.valorNumerico)
        : null
      const valorBooleano = actual.valorBooleano === '' ||
        actual.valorBooleano === undefined || actual.valorBooleano === null
        ? null
        : actual.valorBooleano === 'true'
      const observacion = actual.observacion?.trim() || null
      if (valorTexto === null && valorNumerico === null &&
        valorBooleano === null && observacion === null) {
        return null
      }
      return {
        idCriterio: criterio.idCriterio,
        valorTexto,
        valorNumerico: Number.isFinite(valorNumerico) ? valorNumerico : null,
        valorBooleano,
        observacion,
      }
    })
    .filter(Boolean)
}

export function SpecialistEvaluationPage() {
  const { id } = useParams()
  const idSolicitud = Number(id)
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [intento, setIntento] = useState(0)
  const [dictamen, setDictamen] = useState('')
  const [conditionGrade, setConditionGrade] = useState('')
  const [technicalHealth, setTechnicalHealth] = useState('')
  const [observacionesGenerales, setObservacionesGenerales] = useState('')
  const [resultados, setResultados] = useState({})
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('')
  const [idTipoEvidenciaSolicitada, setIdTipoEvidenciaSolicitada] = useState('')
  const [tiposEvidencia, setTiposEvidencia] = useState([])
  const [certificado, setCertificado] = useState(null)

  useEffect(() => {
    let activo = true
    obtenerAsignacion(idSolicitud)
      .then((data) => {
        if (!activo) return
        setDetalle(data)
        setCertificado(data.certificado ?? null)
        setDictamen(data.evaluacion?.dictamen ?? '')
        setConditionGrade(valorInicial(data.evaluacion, 'conditionGrade'))
        setTechnicalHealth(valorInicial(data.evaluacion, 'technicalHealth'))
        setObservacionesGenerales(data.evaluacion?.observacionesGenerales ?? '')
        const iniciales = {}
        for (const criterio of data.criterios ?? []) {
          const resultado = data.evaluacion?.resultados?.find(
            (item) => item.idCriterio === criterio.idCriterio,
          )
          iniciales[criterio.idCriterio] = {
            valorTexto: valorInicial(resultado, 'valorTexto'),
            valorNumerico: valorInicial(resultado, 'valorNumerico'),
            valorBooleano: resultado?.valorBooleano === null ||
              resultado?.valorBooleano === undefined
              ? ''
              : String(resultado.valorBooleano),
            observacion: resultado?.observacion ?? '',
          }
        }
        setResultados(iniciales)
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
  }, [idSolicitud, intento])

  useEffect(() => {
    let activo = true
    if (!detalle?.idCategoria) return undefined
    obtenerRequisitos(detalle.idCategoria)
      .then((data) => {
        if (activo) setTiposEvidencia(data.evidencias ?? [])
      })
      .catch(() => {
        if (activo) setTiposEvidencia([])
      })
    return () => {
      activo = false
    }
  }, [detalle?.idCategoria])

  if (!Number.isInteger(idSolicitud) || idSolicitud <= 0) {
    return (
      <div className="workspace-page">
        <InlineError>La asignación indicada no es válida.</InlineError>
      </div>
    )
  }

  if (cargando) return <PageLoader label="Cargando la asignación…" />
  if (error) {
    return (
      <div className="workspace-page">
        <ErrorState
          description={error}
          onAction={() => setIntento((actual) => actual + 1)}
          title="No pudimos cargar la asignación"
        />
        <Link className="button button-secondary" to="/app/especialista">
          <Icon name="arrow-left" size={16} /> Volver a asignaciones
        </Link>
      </div>
    )
  }
  if (!detalle) return null

  const evaluacion = detalle.evaluacion
  const finalizada = Boolean(evaluacion?.fechaFin)
  const soloLectura = finalizada || !detalle.puedeEvaluar
  const criterios = detalle.criterios ?? []

  function cambiarResultado(idCriterio, campo, valor) {
    setResultados((actual) => ({
      ...actual,
      [idCriterio]: {
        ...(actual[idCriterio] ?? {}),
        [campo]: valor,
      },
    }))
    setErrores((actual) => ({ ...actual, [`criterios.${idCriterio}`]: undefined }))
    setMensaje('')
  }

  function datosEvaluacion() {
    return {
      conditionGrade: conditionGrade === '' ? null : Number(conditionGrade),
      technicalHealth: technicalHealth === '' ? null : Number(technicalHealth),
      observacionesGenerales: observacionesGenerales.trim() || null,
      resultados: construirResultados(criterios, resultados),
    }
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    setMensaje('')
    setErrores({})
    try {
      await guardarEvaluacion(idSolicitud, datosEvaluacion())
      setMensaje('Borrador de evaluación guardado.')
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setErrores(erroresDeCampo(fallo))
      setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function finalizar() {
    if (!dictamen) {
      setError('Selecciona un dictamen antes de finalizar la evaluación.')
      return
    }
    if (conditionGrade === '') {
      setError('Registra la calificación de condición antes de finalizar.')
      return
    }
    setGuardando(true)
    setError('')
    setMensaje('')
    setErrores({})
    try {
      await finalizarEvaluacion(idSolicitud, {
        ...datosEvaluacion(),
        dictamen,
      })
      setMensaje('Evaluación finalizada. El dictamen ya está disponible para el solicitante.')
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setErrores(erroresDeCampo(fallo))
      setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function pedirEvidencia() {
    if (!descripcionEvidencia.trim()) {
      setError('Describe la evidencia adicional que necesitas.')
      return
    }
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      await solicitarEvidencia(idSolicitud, {
        idTipoEvidencia: idTipoEvidenciaSolicitada
          ? Number(idTipoEvidenciaSolicitada)
          : null,
        descripcion: descripcionEvidencia.trim(),
      })
      setDescripcionEvidencia('')
      setIdTipoEvidenciaSolicitada('')
      setMensaje('Solicitud de evidencia registrada. El solicitante recibió el aviso.')
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function emitir() {
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      const emitido = await emitirCertificado(idSolicitud)
      setCertificado(emitido)
      setMensaje('Certificado emitido correctamente.')
      setIntento((actual) => actual + 1)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
      setIntento((actual) => actual + 1)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Asignación {detalle.folio}</p>
          <h1>{detalle.nombreProducto}</h1>
          <p>
            {detalle.categoria}
            {detalle.marca ? ` · ${detalle.marca}` : ''} · Solicitada{' '}
            {formatearFecha(detalle.fechaSolicitud)}
          </p>
        </div>
        <div className="detail-status">
          <StatusBadge codigo={detalle.estadoCodigo} />
          <Link className="button button-secondary" to="/app/especialista">
            <Icon name="arrow-left" size={16} /> Asignaciones
          </Link>
        </div>
      </header>

      {error ? <InlineError>{error}</InlineError> : null}
      {mensaje ? <div className="alert alert-success" role="status">{mensaje}</div> : null}

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
          <div className={`certificate-result certificate-result-${tonoDictamen(
            certificado.dictamen ?? evaluacion?.dictamen,
          )}`}>
            <span>Resultado registrado</span>
            <strong>{etiquetaDictamen(certificado.dictamen ?? evaluacion?.dictamen)}</strong>
          </div>
          <p className="panel-note">
            Emitido {formatearFecha(certificado.fechaEmision)}. Comparte el enlace de
            verificación pública; no expone datos personales del solicitante.
          </p>
          <CertificateQr token={certificado.qrToken} />
          <Link className="button button-secondary" to={`/verificar/${certificado.qrToken}`}>
            <Icon name="external-link" size={16} /> Ver enlace público
          </Link>
        </section>
      ) : null}

      <div className="detail-layout">
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="box" size={22} /></span>
            <div>
              <p className="card-kicker">Producto</p>
              <h2>Datos registrados</h2>
            </div>
          </div>
          <dl className="review-grid">
            <div><dt>Modelo</dt><dd>{detalle.modelo ?? 'No indicado'}</dd></div>
            <div><dt>SKU</dt><dd>{detalle.sku ?? 'No indicado'}</dd></div>
            <div><dt>Número de serie</dt><dd>{detalle.numeroSerie ?? 'No indicado'}</dd></div>
            <div><dt>IMEI</dt><dd>{detalle.imei ?? 'No indicado'}</dd></div>
            <div className="review-wide"><dt>Accesorios</dt><dd>{detalle.accesorios ?? 'No indicado'}</dd></div>
            <div className="review-wide"><dt>Descripción</dt><dd>{detalle.descripcion ?? 'No indicada'}</dd></div>
            <div className="review-wide"><dt>Observaciones del solicitante</dt><dd>{detalle.observaciones ?? 'Sin observaciones'}</dd></div>
          </dl>
        </section>

        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="certificate" size={22} /></span>
            <div>
              <p className="card-kicker">Evidencia</p>
              <h2>Archivos privados</h2>
            </div>
            <span className="badge badge-neutral">{detalle.evidencias.length}</span>
          </div>
          {detalle.evidencias.length === 0 ? (
            <p className="panel-note">La solicitud no tiene evidencia activa.</p>
          ) : (
            <div className="evidence-grid">
              {detalle.evidencias.map((evidencia) => (
                <div className="evidence-detail" key={evidencia.idEvidencia}>
                  <EvidencePreview
                    cargarArchivo={obtenerArchivoEvidencia}
                    evidencia={evidencia}
                    idSolicitud={detalle.idSolicitud}
                  />
                  <strong>{evidencia.nombre}</strong>
                  {evidencia.descripcion ? <p>{evidencia.descripcion}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-card-heading">
          <span className="feature-icon"><Icon name="clipboard" size={22} /></span>
          <div>
            <p className="card-kicker">Evaluación</p>
            <h2>Criterios de la categoría</h2>
          </div>
          {finalizada ? <span className="badge badge-success">Finalizada</span> : null}
        </div>

        {criterios.length === 0 ? (
          <p className="panel-note">
            La categoría no tiene criterios configurados. Puedes registrar las
            observaciones generales y el dictamen.
          </p>
        ) : (
          <div className="criteria-list">
            {criterios.map((criterio) => {
              const actual = resultados[criterio.idCriterio] ?? {}
              return (
                <fieldset className="criterion-card" disabled={soloLectura} key={criterio.idCriterio}>
                  <legend>
                    {criterio.nombre}
                    {criterio.obligatorio ? ' *' : ''}
                    <span className="badge badge-neutral">{TIPOS_CRITERIO[criterio.tipoDato] ?? criterio.tipoDato}</span>
                  </legend>
                  {criterio.descripcion ? <p className="field-hint">{criterio.descripcion}</p> : null}
                  {criterio.tipoDato === 'TEXTO' ? (
                    <textarea
                      aria-label={`Valor de ${criterio.nombre}`}
                      onChange={(evento) => cambiarResultado(
                        criterio.idCriterio, 'valorTexto', evento.target.value)}
                      rows={3}
                      value={actual.valorTexto ?? ''}
                    />
                  ) : criterio.tipoDato === 'BOOLEANO' ? (
                    <select
                      aria-label={`Valor de ${criterio.nombre}`}
                      onChange={(evento) => cambiarResultado(
                        criterio.idCriterio, 'valorBooleano', evento.target.value)}
                      value={actual.valorBooleano ?? ''}
                    >
                      <option value="">Sin definir</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      aria-label={`Valor de ${criterio.nombre}`}
                      onChange={(evento) => cambiarResultado(
                        criterio.idCriterio, 'valorNumerico', evento.target.value)}
                      step="0.01"
                      type="number"
                      value={actual.valorNumerico ?? ''}
                    />
                  )}
                  <input
                    aria-label={`Observación de ${criterio.nombre}`}
                    className="criterion-observation"
                    onChange={(evento) => cambiarResultado(
                      criterio.idCriterio, 'observacion', evento.target.value)}
                    placeholder="Observación del criterio (opcional)"
                    value={actual.observacion ?? ''}
                  />
                  {errores[`criterios.${criterio.idCriterio}`] ? (
                    <p className="field-error" role="alert">
                      {errores[`criterios.${criterio.idCriterio}`]}
                    </p>
                  ) : null}
                </fieldset>
              )
            })}
          </div>
        )}

        <div className="form-grid evaluation-general">
          <div className="field">
            <label htmlFor="conditionGrade">Condition Grade (0-10) *</label>
            <input
              disabled={soloLectura}
              id="conditionGrade"
              max="10"
              min="0"
              onChange={(evento) => setConditionGrade(evento.target.value)}
              step="0.01"
              type="number"
              value={conditionGrade}
            />
          </div>
          <div className="field">
            <label htmlFor="technicalHealth">Technical Health (0-100)</label>
            <input
              disabled={soloLectura}
              id="technicalHealth"
              max="100"
              min="0"
              onChange={(evento) => setTechnicalHealth(evento.target.value)}
              step="0.01"
              type="number"
              value={technicalHealth}
            />
          </div>
          <div className="field field-wide">
            <label htmlFor="observacionesGenerales">Observaciones generales</label>
            <textarea
              disabled={soloLectura}
              id="observacionesGenerales"
              maxLength={1500}
              onChange={(evento) => setObservacionesGenerales(evento.target.value)}
              rows={4}
              value={observacionesGenerales}
            />
          </div>
          <div className="field">
            <label htmlFor="dictamen">Dictamen *</label>
            <select
              disabled={soloLectura}
              id="dictamen"
              onChange={(evento) => setDictamen(evento.target.value)}
              value={dictamen}
            >
              <option value="">Selecciona un dictamen</option>
              {DICTAMENES.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        {!soloLectura ? (
          <div className="form-actions">
            <button className="button button-secondary" disabled={guardando} onClick={guardar} type="button">
              {guardando ? <><span className="spinner spinner-small" /> Guardando…</> : <><Icon name="save" size={17} /> Guardar borrador</>}
            </button>
            <button className="button button-primary" disabled={guardando} onClick={finalizar} type="button">
              <Icon name="check" size={17} /> Finalizar evaluación
            </button>
          </div>
        ) : null}

        {finalizada && detalle.puedeEmitirCertificado ? (
          <div className="form-actions">
            <button className="button button-primary" disabled={guardando} onClick={emitir} type="button">
              <Icon name="certificate" size={17} /> Emitir certificado
            </button>
          </div>
        ) : null}
      </section>

      {!finalizada && detalle.puedeSolicitarEvidencia ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="alert" size={22} /></span>
            <div>
              <p className="card-kicker">Evidencia adicional</p>
              <h2>Solicitar al solicitante</h2>
            </div>
          </div>
          <div className="field field-wide">
            <label htmlFor="tipoEvidenciaSolicitada">Tipo de evidencia (opcional)</label>
            <select
              id="tipoEvidenciaSolicitada"
              onChange={(evento) => setIdTipoEvidenciaSolicitada(evento.target.value)}
              value={idTipoEvidenciaSolicitada}
            >
              <option value="">Cualquiera de la categoría</option>
              {tiposEvidencia.map((tipo) => (
                <option key={tipo.idTipoEvidencia} value={tipo.idTipoEvidencia}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field field-wide">
            <label htmlFor="descripcionEvidencia">¿Qué evidencia necesitas?</label>
            <textarea
              id="descripcionEvidencia"
              maxLength={600}
              onChange={(evento) => setDescripcionEvidencia(evento.target.value)}
              placeholder="Ej. Foto adicional de la etiqueta trasera"
              rows={3}
              value={descripcionEvidencia}
            />
          </div>
          <div className="form-actions">
            <button className="button button-secondary" disabled={guardando} onClick={pedirEvidencia} type="button">
              <Icon name="send" size={17} /> Solicitar evidencia
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
