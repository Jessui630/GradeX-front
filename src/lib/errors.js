import { ApiError } from './api'

const PATRONES_TECNICOS = [
  /an error occurred/i,
  /internal server error/i,
  /unhandled exception/i,
  /\bexception\b/i,
  /stack trace/i,
  /nullreference/i,
  /failed to fetch/i,
  /networkerror/i,
  /request failed with status code/i,
  /one or more validation errors/i,
  /the .+ field is required/i,
  /<html/i,
  /<\/?[a-z][\s\S]*>/i,
]

function esMensajeTecnico(mensaje) {
  return PATRONES_TECNICOS.some((patron) => patron.test(mensaje))
}

export function mensajeDeError(error) {
  if (!(error instanceof ApiError)) {
    return 'Ocurrió un error inesperado. Intenta nuevamente.'
  }

  if (error.status === 0) {
    const mensaje = error.message?.trim()
    if (!mensaje || esMensajeTecnico(mensaje)) {
      return 'No fue posible conectar con el servidor. Revisa tu conexión.'
    }
    return mensaje
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

  if (error.status >= 500) {
    return 'Ocurrió un error inesperado. Intenta nuevamente.'
  }

  const mensaje = error.message?.trim()
  if (!mensaje || esMensajeTecnico(mensaje)) {
    return 'No fue posible completar la operación.'
  }

  return mensaje
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
