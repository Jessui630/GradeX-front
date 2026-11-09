const NOMBRES_ESTADO = {
  BORRADOR: 'Borrador',
  PENDIENTE_ASIGNACION: 'Pendiente de asignación',
  ASIGNADA: 'Asignada',
  EN_EVALUACION: 'En evaluación',
  FALTA_EVIDENCIA: 'Falta evidencia',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export function etiquetaEstado(codigo) {
  return NOMBRES_ESTADO[codigo] ?? codigo
}

export function tonoEstado(codigo) {
  if (codigo === 'FINALIZADA') return 'success'
  if (codigo === 'BORRADOR' || codigo === 'PENDIENTE_ASIGNACION' || codigo === 'FALTA_EVIDENCIA') return 'warn'
  if (codigo === 'ASIGNADA' || codigo === 'EN_EVALUACION') return 'info'
  return 'neutral'
}

export function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

export function formatearTamano(bytes) {
  if (!bytes) return 'Sin tamaño'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
