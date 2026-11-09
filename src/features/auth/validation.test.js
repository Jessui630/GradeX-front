import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizarNfc,
  validarContrasena,
  validarCorreo,
  validarInicioSesion,
  validarNombre,
  validarRegistro,
} from './validation.js'

test('acepta un nombre con contenido', () => {
  assert.equal(validarNombre('  Nombre de prueba  '), null)
  assert.match(validarNombre('   '), /nombre/i)
})

test('rechaza correos inválidos y acepta uno ASCII', () => {
  assert.equal(validarCorreo('usuario@example.com'), null)
  assert.match(validarCorreo('usuario'), /válido/i)
  assert.match(validarCorreo('usuario@example'), /válido/i)
})

test('exige contraseña de al menos 15 puntos Unicode', () => {
  assert.match(validarContrasena('corta'), /15/)
  assert.equal(validarContrasena('Una frase de prueba larga'), null)
})

test('conserva espacios y normaliza NFC para contar', () => {
  const descompuesta = '  frase larga e\u0301 de prueba  '
  assert.equal(validarContrasena(descompuesta), null)
  assert.equal(normalizarNfc(descompuesta), '  frase larga é de prueba  ')
})

test('rechaza caracteres de control', () => {
  assert.match(validarContrasena('frase con control\u0007 larga'), /no permitidos/)
})

test('valida confirmación de contraseña', () => {
  const errores = validarRegistro({
    nombreCompleto: 'Nombre',
    correo: 'usuario@example.com',
    contrasena: 'Una frase de prueba larga',
    confirmacion: 'Otra frase distinta',
  })
  assert.match(errores.confirmacion, /no coinciden/)
})

test('login exige correo y contraseña', () => {
  const errores = validarInicioSesion({ correo: '', contrasena: '' })
  assert.ok(errores.correo)
  assert.ok(errores.contrasena)
})
