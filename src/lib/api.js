import { env } from '../config/env'

export class ApiError extends Error {
  constructor(message, { status = 0, errors, retryAfter, problem } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.retryAfter = retryAfter
    this.problem = problem
  }
}

async function leerRespuesta(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    return response.json().catch(() => null)
  }

  const text = await response.text()
  return text ? { detail: text } : null
}

async function obtenerTokenCsrf() {
  let response

  try {
    response = await fetch(`${env.apiUrl}/sesiones/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiError('No fue posible conectar con el servidor.', { status: 0 })
  }

  const data = await leerRespuesta(response)
  if (!response.ok || !data?.token) {
    throw new ApiError('No fue posible preparar una solicitud segura.', {
      status: response.status,
      problem: data,
    })
  }

  return data.token
}

function mensajePredeterminado(status) {
  if (status === 401) return 'El correo o la contraseña no son correctos.'
  if (status === 403) return 'No tienes permisos para realizar esta operación.'
  if (status === 409) return 'El correo ya está registrado.'
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.'
  if (status === 503) return 'El servicio no está disponible en este momento. Intenta nuevamente.'
  if (status >= 500) return 'Ocurrió un error inesperado. Intenta nuevamente.'
  return 'No fue posible completar la operación.'
}

export async function apiFetch(path, { method = 'GET', body, csrf = false, signal, headers: extraHeaders } = {}) {
  const headers = {
    Accept: 'application/problem+json, application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (extraHeaders) Object.assign(headers, extraHeaders)

  if (csrf) {
    headers['X-CSRF-Token'] = await obtenerTokenCsrf()
  }

  let response

  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('No fue posible conectar con el servidor. Revisa tu conexión.', { status: 0 })
  }

  const data = await leerRespuesta(response)

  if (!response.ok) {
    throw new ApiError(data?.detail || data?.title || mensajePredeterminado(response.status), {
      status: response.status,
      errors: data?.errors,
      retryAfter: response.headers.get('Retry-After'),
      problem: data,
    })
  }

  return data
}

export async function apiUpload(path, formData, { signal } = {}) {
  const headers = {
    Accept: 'application/problem+json, application/json',
    'X-CSRF-Token': await obtenerTokenCsrf(),
  }

  let response
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('No fue posible conectar con el servidor. Revisa tu conexión.', { status: 0 })
  }

  const data = await leerRespuesta(response)
  if (!response.ok) {
    throw new ApiError(data?.detail || data?.title || mensajePredeterminado(response.status), {
      status: response.status,
      errors: data?.errors,
      retryAfter: response.headers.get('Retry-After'),
      problem: data,
    })
  }

  return data
}

export async function apiBlob(path, { signal } = {}) {
  let response
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'image/*' },
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('No fue posible cargar la imagen.', { status: 0 })
  }

  if (!response.ok) {
    const data = await leerRespuesta(response)
    throw new ApiError(data?.detail || data?.title || 'No fue posible cargar la imagen.', {
      status: response.status,
      problem: data,
    })
  }

  return response.blob()
}
