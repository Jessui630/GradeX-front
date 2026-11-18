import { apiFetch } from '../../lib/api'

export function obtenerPerfil() {
  return apiFetch('/perfil')
}

export function actualizarPerfil(datos) {
  return apiFetch('/perfil', {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function cambiarContrasena(datos) {
  return apiFetch('/perfil/contrasena', {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}
