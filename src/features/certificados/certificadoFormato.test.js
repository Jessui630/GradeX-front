import assert from 'node:assert/strict'
import { it } from 'vitest'
import {
  enlaceVerificacion,
  etiquetaDictamen,
  formatearCalificacion,
  tonoDictamen,
} from './certificadoFormato.js'

it('el dictamen no auténtico no se presenta como auténtico', () => {
  assert.equal(etiquetaDictamen('NO_AUTENTICO'), 'No auténtico')
  assert.equal(tonoDictamen('NO_AUTENTICO'), 'danger')
  assert.equal(etiquetaDictamen('INCONCLUSO'), 'Inconcluso')
  assert.equal(tonoDictamen('INCONCLUSO'), 'warn')
  assert.equal(etiquetaDictamen('AUTENTICO'), 'Auténtico')
  assert.equal(tonoDictamen('AUTENTICO'), 'success')
})

it('un dictamen ausente no se interpreta como auténtico', () => {
  assert.equal(etiquetaDictamen(null), 'Sin dictamen')
  assert.equal(tonoDictamen(undefined), 'neutral')
})

it('el enlace de verificación usa el token y no expone otros datos', () => {
  assert.equal(
    enlaceVerificacion('abc-123', 'https://gradex.test'),
    'https://gradex.test/verificar/abc-123',
  )
  assert.equal(enlaceVerificacion(null, 'https://gradex.test'), null)
})

it('la calificación se muestra con la escala registrada', () => {
  assert.equal(formatearCalificacion(9), '9.00 / 10')
  assert.equal(formatearCalificacion(null), 'No registrada')
})
