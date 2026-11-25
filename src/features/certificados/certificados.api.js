import { apiFetch } from '../../lib/api'

export function listarCertificados() {
  return apiFetch('/certificados')
}

export function obtenerCertificadoSolicitud(idSolicitud) {
  return apiFetch(`/certificados/solicitud/${idSolicitud}`)
}

export function verificarCertificado(token) {
  return apiFetch(`/certificados/verificar/${token}`)
}

export function verificarCertificadoPorNumero(numero) {
  return apiFetch(`/certificados/verificar/numero/${encodeURIComponent(numero)}`)
}
