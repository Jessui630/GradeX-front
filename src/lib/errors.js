import { ApiError } from './api'

export function mensajeDeError(error) {
  if (!(error instanceof ApiError)) {
    return 'Ocurrió un error inesperado. Intenta nuevamente.'
  }

  if (error.status === 0) {
    return error.message
  }

  if (error.status === 429) {
    const segundos = Number.parseInt(error.retryAfter ?? '', 10)
    if (Number.isFinite(segundos) && segundos > 0) {
      return `Demasiadas solicitudes. Intenta de nuevo en ${segundos} segundos.`
    }
    return 'Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.'
  }

  if (error.status === 503) {
    return 'El servicio no está disponible en este momento. Intenta nuevamente en breve.'
  }

  if (error.status === 409) {
    return 'El correo ya está registrado. ¿Quieres iniciar sesión?'
  }

  return error.message
}

export function erroresDeCampo(error) {
  if (!(error instanceof ApiError) || !error.errors) return {}
  return Object.fromEntries(
    Object.entries(error.errors).map(([campo, mensajes]) => [
      campo,
      Array.isArray(mensajes) ? mensajes[0] : String(mensajes),
    ]),
  )
}
