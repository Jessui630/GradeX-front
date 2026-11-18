import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from './ApiError.js'
import { mensajeDeError } from './errors.js'

test('un 409 conserva el detalle del servidor y no lo confunde con el correo', () => {
  const error = new ApiError('La solicitud ya fue enviada.', { status: 409 })

  assert.equal(mensajeDeError(error), 'La solicitud ya fue enviada.')
  assert.doesNotMatch(mensajeDeError(error), /correo/i)
})

test('un 409 sin detalle invita a recargar sin mencionar el registro', () => {
  const mensaje = mensajeDeError(new ApiError('', { status: 409 }))

  assert.match(mensaje, /Recarga/i)
  assert.doesNotMatch(mensaje, /correo/i)
})

test('un 503 conserva el detalle operativo del servidor', () => {
  const error = new ApiError(
    'No fue posible guardar la evidencia. Intenta nuevamente.',
    { status: 503 },
  )

  assert.equal(mensajeDeError(error), error.message)
})

test('un mensaje técnico de 500 no se expone al usuario', () => {
  const error = new ApiError('An error occurred while processing your request.', {
    status: 500,
  })

  assert.equal(mensajeDeError(error), 'Ocurrió un error inesperado. Intenta nuevamente.')
})
