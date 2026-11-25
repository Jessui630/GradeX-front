import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiBlob, apiFetch, apiUpload } from './api'

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problemResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

describe('cliente HTTP', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve JSON y respeta 204', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/catalogo/categorias')).resolves.toEqual({ ok: true })
    await expect(apiFetch('/perfil', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('obtiene CSRF y lo envía en mutaciones', async () => {
    const fetchMock = vi.fn((url) => {
      if (String(url).endsWith('/sesiones/csrf'))
        return Promise.resolve(jsonResponse({ token: 'token-csrf' }))
      return Promise.resolve(jsonResponse({ guardado: true }))
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/perfil', { method: 'PUT', body: { nombre: 'Nuevo' }, csrf: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, options] = fetchMock.mock.calls[1]
    expect(options.method).toBe('PUT')
    expect(options.headers['X-CSRF-Token']).toBe('token-csrf')
    expect(options.credentials).toBe('include')
    expect(options.body).toBe(JSON.stringify({ nombre: 'Nuevo' }))
  })

  it('traduce errores HTTP a ApiError con problem details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problemResponse(409, {
      detail: 'La solicitud cambió de estado.',
      errors: { estado: ['Ya no es editable.'] },
    })))

    const error = await apiFetch('/solicitudes/1/enviar').catch((fallo) => fallo)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe('La solicitud cambió de estado.')
    expect(error.errors.estado[0]).toBe('Ya no es editable.')
  })

  it('traduce fallos de red a ApiError de estado 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('falló la red')))

    const error = await apiFetch('/catalogo/categorias').catch((fallo) => fallo)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toContain('No fue posible conectar')
  })

  it('sube formularios con CSRF y devuelve la respuesta', async () => {
    const fetchMock = vi.fn((url) => {
      if (String(url).endsWith('/sesiones/csrf'))
        return Promise.resolve(jsonResponse({ token: 'token-csrf' }))
      return Promise.resolve(jsonResponse({ idEvidencia: 1 }, 201))
    })
    vi.stubGlobal('fetch', fetchMock)
    const datos = new FormData()
    datos.append('Archivo', new Blob(['x']), 'foto.png')

    const resultado = await apiUpload('/solicitudes/1/evidencias', datos)

    expect(resultado.idEvidencia).toBe(1)
    const [, options] = fetchMock.mock.calls[1]
    expect(options.body).toBe(datos)
    expect(options.headers['X-CSRF-Token']).toBe('token-csrf')
  })

  it('descarga blobs y propaga errores de archivo', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('imagen', {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      }))
      .mockResolvedValueOnce(problemResponse(404, { detail: 'Archivo no encontrado.' }))
    vi.stubGlobal('fetch', fetchMock)

    const blob = await apiBlob('/solicitudes/1/evidencias/2/archivo')
    expect(await blob.text()).toBe('imagen')

    const error = await apiBlob('/solicitudes/1/evidencias/3/archivo')
      .catch((fallo) => fallo)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
  })
})
