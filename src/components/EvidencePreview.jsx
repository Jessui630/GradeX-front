import { useEffect, useState } from 'react'
import { obtenerArchivoEvidencia } from '../features/solicitudes/solicitudes.api'
import { Icon } from './Icon'

export function EvidencePreview({ idSolicitud, evidencia, className = '' }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)
  const idEvidencia = evidencia?.idEvidencia

  useEffect(() => {
    if (!idSolicitud || !idEvidencia) return undefined

    let activo = true
    let objectUrl
    const controlador = new AbortController()

    obtenerArchivoEvidencia(idSolicitud, idEvidencia, controlador.signal)
      .then((blob) => {
        if (!activo) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch((fallo) => {
        if (activo && fallo?.name !== 'AbortError') setError(true)
      })

    return () => {
      activo = false
      controlador.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [idSolicitud, idEvidencia])

  return (
    <div className={`evidence-preview ${className}`}>
      {url ? (
        <img alt={`Evidencia ${evidencia?.nombre ?? ''}`} loading="lazy" src={url} />
      ) : error ? (
        <span className="evidence-preview-error">
          <Icon name="alert" size={20} /> No se pudo cargar
        </span>
      ) : (
        <span className="spinner" />
      )}
      <span className="evidence-preview-label">
        {evidencia?.nombre ?? 'Evidencia'}
      </span>
    </div>
  )
}
