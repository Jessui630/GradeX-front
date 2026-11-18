import { apiBlob, apiFetch } from '../../lib/api'

export function listarAsignaciones({ pagina = 1, tamanoPagina = 20, estado } = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  })
  if (estado) parametros.set('estado', estado)
  return apiFetch(`/especialista/asignaciones?${parametros.toString()}`)
}

export function obtenerAsignacion(idSolicitud) {
  return apiFetch(`/especialista/asignaciones/${idSolicitud}`)
}

export function guardarEvaluacion(idSolicitud, datos) {
  return apiFetch(`/especialista/asignaciones/${idSolicitud}/evaluacion`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function finalizarEvaluacion(idSolicitud, datos) {
  return apiFetch(`/especialista/asignaciones/${idSolicitud}/dictamen`, {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function solicitarEvidencia(idSolicitud, datos) {
  return apiFetch(`/especialista/asignaciones/${idSolicitud}/solicitar-evidencia`, {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function emitirCertificado(idSolicitud) {
  return apiFetch(`/especialista/asignaciones/${idSolicitud}/certificado`, {
    method: 'POST',
    csrf: true,
  })
}

export function obtenerArchivoEvidencia(idSolicitud, idEvidencia, signal) {
  return apiBlob(
    `/especialista/asignaciones/${idSolicitud}/evidencias/${idEvidencia}/archivo`,
    { signal },
  )
}
