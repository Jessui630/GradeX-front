import { etiquetaEstado, tonoEstado } from '../features/solicitudes/solicitudFormato'

export function StatusBadge({ codigo }) {
  return (
    <span className={`badge badge-${tonoEstado(codigo)}`}>
      <span className="badge-dot" />
      {etiquetaEstado(codigo)}
    </span>
  )
}
