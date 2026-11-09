import { apiFetch } from '../../lib/api'

export function registrarCuenta(datos) {
  return apiFetch('/cuentas', { method: 'POST', body: datos })
}

export function iniciarSesion(datos) {
  return apiFetch('/sesiones', { method: 'POST', body: datos, csrf: true })
}

export function obtenerSesionActual() {
  return apiFetch('/sesiones/actual')
}

export function cerrarSesion() {
  return apiFetch('/sesiones/actual', { method: 'DELETE', csrf: true })
}
