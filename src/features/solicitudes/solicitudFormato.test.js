import test from 'node:test'
import assert from 'node:assert/strict'
import { etiquetaEstado, formatearTamano, tonoEstado } from './solicitudFormato.js'

test('traduce los estados visibles de una solicitud', () => {
  assert.equal(etiquetaEstado('BORRADOR'), 'Borrador')
  assert.equal(etiquetaEstado('PENDIENTE_ASIGNACION'), 'Pendiente de asignación')
})

test('asigna un tono semántico a cada estado', () => {
  assert.equal(tonoEstado('PENDIENTE_ASIGNACION'), 'warn')
  assert.equal(tonoEstado('FINALIZADA'), 'success')
  assert.equal(tonoEstado('DESCONOCIDO'), 'neutral')
})

test('presenta tamaños de archivo legibles', () => {
  assert.equal(formatearTamano(512), '512 B')
  assert.equal(formatearTamano(2048), '2.0 KB')
  assert.equal(formatearTamano(2 * 1024 * 1024), '2.0 MB')
})
