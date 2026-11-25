import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CertificateQr } from '../components/CertificateQr'
import { Icon } from '../components/Icon'
import { EmptyState, ErrorState, PageLoader } from '../components/PageState'
import { listarCertificados } from '../features/certificados/certificados.api'
import {
  etiquetaDictamen,
  formatearCalificacion,
  tonoDictamen,
} from '../features/certificados/certificadoFormato'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { mensajeDeError } from '../lib/errors'

export function MyCertificatesPage() {
  const [certificados, setCertificados] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarCertificados()
      .then((data) => {
        if (activo) setCertificados(data)
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
  }, [intento])

  if (cargando) return <PageLoader label="Cargando tus certificados." />

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Resultados</p>
          <h1>Mis certificados</h1>
          <p>Certificados emitidos después de una evaluación finalizada.</p>
        </div>
      </header>

      {error ? (
        <ErrorState
          description="No pudimos obtener tus certificados."
          onAction={() => {
            setError('')
            setCargando(true)
            setIntento((actual) => actual + 1)
          }}
          title="Error al cargar certificados"
        />
      ) : !certificados?.length ? (
        <EmptyState
          compact
          description="Cuando una evaluación finalice y el especialista emita el certificado, aparecerá aquí."
          icon="certificate"
          title="Aún no tienes certificados"
        />
      ) : (
        <div className="certificate-list">
          {certificados.map((certificado) => (
            <article className="panel-card" key={certificado.idCertificado}>
              <div className="panel-card-heading">
                <span className="feature-icon">
                  <Icon name="certificate" size={22} />
                </span>
                <div>
                  <p className="card-kicker">{certificado.folio}</p>
                  <h2>{certificado.numeroCertificado}</h2>
                </div>
                <span className="badge badge-success">{certificado.estadoNombre}</span>
              </div>
              <div className={`certificate-result certificate-result-${tonoDictamen(certificado.dictamen)}`}>
                <span>Resultado de la evaluación</span>
                <strong>{etiquetaDictamen(certificado.dictamen)}</strong>
              </div>
              <dl className="review-grid">
                <div className="review-wide">
                  <dt>Producto</dt>
                  <dd>{certificado.nombreProducto}</dd>
                </div>
                <div><dt>Modelo</dt><dd>{certificado.modelo ?? 'No indicado'}</dd></div>
                <div><dt>Categoría</dt><dd>{certificado.categoria}</dd></div>
                <div><dt>Marca</dt><dd>{certificado.marca ?? 'Sin marca'}</dd></div>
                <div><dt>Condición</dt><dd>{formatearCalificacion(certificado.conditionGrade)}</dd></div>
                <div><dt>Emisión</dt><dd>{formatearFecha(certificado.fechaEmision)}</dd></div>
                <div className="review-wide">
                  <dt>Especialista</dt>
                  <dd>{certificado.especialista ?? 'No disponible'}</dd>
                </div>
                <div className="review-wide">
                  <dt>Especialidad</dt>
                  <dd>{certificado.especialidad ?? 'No disponible'}</dd>
                </div>
              </dl>
              <CertificateQr token={certificado.qrToken} size={104} />
              <div className="hero-actions">
                <Link className="button button-primary" to={`/verificar/${certificado.qrToken}`}>
                  <Icon name="shield" size={17} /> Verificar certificado
                </Link>
                <Link className="button button-secondary" to={`/app/solicitudes/${certificado.idSolicitud}`}>
                  <Icon name="clipboard" size={17} /> Ver solicitud
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
