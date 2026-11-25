import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { InlineError } from '../components/PageState'
import {
  verificarCertificado,
  verificarCertificadoPorNumero,
} from '../features/certificados/certificados.api'
import {
  etiquetaDictamen,
  formatearCalificacion,
  tonoDictamen,
} from '../features/certificados/certificadoFormato'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

const FORMATO_GUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function VerifyCertificatePage() {
  const { token } = useParams()
  const [consulta, setConsulta] = useState(token ?? '')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return
    let activo = true
    verificarCertificado(token)
      .then((data) => {
        if (activo) setResultado(data)
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
  }, [token])

  async function buscar(evento) {
    evento.preventDefault()
    const valor = consulta.trim()
    if (!valor) {
      setError('Escribe el número de certificado o el código de verificación.')
      return
    }
    setCargando(true)
    setError('')
    setResultado(null)
    try {
      const data = FORMATO_GUID.test(valor)
        ? await verificarCertificado(valor)
        : await verificarCertificadoPorNumero(valor)
      setResultado(data)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="public-shell landing-shell">
      <header className="public-header landing-header">
        <Brand />
      </header>

      <main className="landing-main" id="contenido-publico">
        <section className="verify-card" aria-labelledby="verify-title">
          <span className="eyebrow">
            <Icon name="shield" size={16} /> Verificación pública
          </span>
          <h1 id="verify-title">Verifica un certificado GradeX</h1>
          <p>
            Introduce el número de certificado o el código del enlace de verificación.
            Solo se muestran datos del producto y del dictamen; nunca información personal
            del solicitante ni documentos privados.
          </p>

          <form className="verify-form" onSubmit={buscar}>
            <label htmlFor="codigoCertificado">Número o código</label>
            <div className="input-action">
              <input
                autoComplete="off"
                id="codigoCertificado"
                onChange={(evento) => setConsulta(evento.target.value)}
                placeholder="GX-20261118-ABCD1234"
                value={consulta}
              />
              <button className="button button-primary" disabled={cargando} type="submit">
                {cargando ? <span className="spinner spinner-small" /> : <Icon name="search" size={17} />}
                Verificar
              </button>
            </div>
          </form>

          {error ? <InlineError>{error}</InlineError> : null}

          {resultado ? (
            <article className="certificate-card" aria-live="polite">
              <div className="certificate-head">
                <span className="feature-icon"><Icon name="certificate" size={24} /></span>
                <div>
                  <p className="card-kicker">Certificado</p>
                  <h2>{resultado.numeroCertificado}</h2>
                </div>
                <span className="badge badge-success">{resultado.estadoNombre}</span>
              </div>
              <div className={`certificate-result certificate-result-${tonoDictamen(resultado.dictamen)}`}>
                <span>Resultado de la evaluación</span>
                <strong>{etiquetaDictamen(resultado.dictamen)}</strong>
              </div>
              <dl className="review-grid">
                <div className="review-wide">
                  <dt>Producto</dt>
                  <dd>{resultado.nombreProducto}</dd>
                </div>
                <div><dt>Modelo</dt><dd>{resultado.modelo ?? 'No indicado'}</dd></div>
                <div><dt>Categoría</dt><dd>{resultado.categoria}</dd></div>
                <div><dt>Marca</dt><dd>{resultado.marca ?? 'Sin marca'}</dd></div>
                <div><dt>Condición</dt><dd>{formatearCalificacion(resultado.conditionGrade)}</dd></div>
                <div><dt>Emisión</dt><dd>{formatearFecha(resultado.fechaEmision)}</dd></div>
                <div>
                  <dt>Vigencia</dt>
                  <dd>{resultado.estadoNombre}
                    {resultado.fechaVencimiento
                      ? ` · vence ${formatearFecha(resultado.fechaVencimiento)}`
                      : ' · sin vencimiento registrado'}</dd>
                </div>
                <div className="review-wide">
                  <dt>Especialista</dt>
                  <dd>{resultado.especialista ?? 'No disponible'}</dd>
                </div>
                <div className="review-wide">
                  <dt>Especialidad</dt>
                  <dd>{resultado.especialidad ?? 'No disponible'}</dd>
                </div>
              </dl>
              <p className="panel-note">
                Este certificado documenta el resultado emitido por el especialista.
                Un dictamen No auténtico o Inconcluso no acredita la autenticidad del producto.
              </p>
            </article>
          ) : null}

          <Link className="back-link" to="/">
            <Icon name="arrow-left" size={16} /> Volver al inicio
          </Link>
        </section>
      </main>
    </div>
  )
}
