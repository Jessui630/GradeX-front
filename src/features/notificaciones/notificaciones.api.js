import { apiFetch } from '../../lib/api'

export function listarNotificaciones({ pagina = 1, tamanoPagina = 20, soloNoLeidas = false } = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
    soloNoLeidas: String(soloNoLeidas),
  })
  return apiFetch(`/notificaciones?${parametros.toString()}`)
}

export function contarNoLeidas() {
  return apiFetch('/notificaciones/no-leidas')
}

export function marcarLeida(idNotificacion) {
  return apiFetch(`/notificaciones/${idNotificacion}/leida`, {
    method: 'PATCH',
    csrf: true,
  })
}

export function marcarTodasLeidas() {
  return apiFetch('/notificaciones/leer-todas', {
    method: 'PATCH',
    csrf: true,
  })
}
