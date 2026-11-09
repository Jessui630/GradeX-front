import { Link } from 'react-router-dom'
import { formatearFecha } from '../features/solicitudes/solicitudFormato'
import { Icon } from './Icon'
import { StatusBadge } from './StatusBadge'

export function RequestCard({ solicitud }) {
  return (
    <Link className="request-card" to={`/app/solicitudes/${solicitud.idSolicitud}`}>
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
        {solicitud.accionPendiente ? (
          <span className="request-action">
            <Icon name="clock" size={15} /> {solicitud.accionPendiente}
          </span>
        ) : null}
      </div>
      <div className="request-card-meta">
        <span>{formatearFecha(solicitud.fechaSolicitud)}</span>
        <span>
          <Icon name="certificate" size={15} /> {solicitud.evidenciasActivas} evidencia
          {solicitud.evidenciasActivas === 1 ? '' : 's'}
        </span>
        <span className="request-card-arrow">
          <Icon name="arrow-right" size={18} />
        </span>
      </div>
    </Link>
  )
}
