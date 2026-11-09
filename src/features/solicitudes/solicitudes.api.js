import { apiBlob, apiFetch, apiUpload } from '../../lib/api'

export function crearSolicitud(datos, claveIdempotencia) {
  return apiFetch('/solicitudes', {
    method: 'POST',
    body: datos,
    csrf: true,
    headers: { 'Idempotency-Key': claveIdempotencia },
  })
}

export function enviarSolicitud(idSolicitud) {
  return apiFetch(`/solicitudes/${idSolicitud}/enviar`, { method: 'POST', csrf: true })
}

export function subirEvidencia(idSolicitud, idTipoEvidencia, archivo, descripcion) {
  const formData = new FormData()
  formData.append('IdTipoEvidencia', String(idTipoEvidencia))
  if (descripcion) formData.append('Descripcion', descripcion)
  formData.append('Archivo', archivo)
  return apiUpload(`/solicitudes/${idSolicitud}/evidencias`, formData)
}

export function listarSolicitudes({ pagina = 1, tamanoPagina = 10, estado } = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  })
  if (estado) parametros.set('estado', estado)
  return apiFetch(`/solicitudes?${parametros.toString()}`)
}

export function obtenerSolicitud(idSolicitud) {
  return apiFetch(`/solicitudes/${idSolicitud}`)
}

export function obtenerArchivoEvidencia(idSolicitud, idEvidencia, signal) {
  return apiBlob(`/solicitudes/${idSolicitud}/evidencias/${idEvidencia}/archivo`, { signal })
}
