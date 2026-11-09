export const LONGITUD_MINIMA_CONTRASENA = 15
export const LONGITUD_MAXIMA_CONTRASENA = 128
export const LONGITUD_MAXIMA_NOMBRE = 150
export const LONGITUD_MAXIMA_CORREO = 254

const CORREO_ASCII =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

export function normalizarNfc(valor) {
  return valor.normalize('NFC')
}

export function contarPuntosUnicode(valor) {
  return [...valor].length
}

export function validarNombre(nombre) {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribe tu nombre completo.'
  if (limpio.length > LONGITUD_MAXIMA_NOMBRE) {
    return `El nombre admite hasta ${LONGITUD_MAXIMA_NOMBRE} caracteres.`
  }
  return null
}

export function validarCorreo(correo) {
  const limpio = correo.trim()
  if (!limpio) return 'Escribe tu correo electrónico.'
  if (limpio.length > LONGITUD_MAXIMA_CORREO) return 'El correo es demasiado largo.'
  if (!CORREO_ASCII.test(limpio)) return 'Escribe un correo electrónico válido.'
  return null
}

export function validarContrasena(contrasena) {
  if (!contrasena) return 'Escribe una contraseña.'
  const normalizada = normalizarNfc(contrasena)
  const longitud = contarPuntosUnicode(normalizada)
  if (longitud < LONGITUD_MINIMA_CONTRASENA) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`
  }
  if (longitud > LONGITUD_MAXIMA_CONTRASENA) {
    return `La contraseña admite hasta ${LONGITUD_MAXIMA_CONTRASENA} caracteres.`
  }
  if ([...normalizada].some((caracter) => /\p{Cc}/u.test(caracter))) {
    return 'La contraseña contiene caracteres no permitidos.'
  }
  return null
}

export function validarRegistro({ nombreCompleto, correo, contrasena, confirmacion }) {
  const errores = {}
  const nombre = validarNombre(nombreCompleto)
  const correoError = validarCorreo(correo)
  const contrasenaError = validarContrasena(contrasena)

  if (nombre) errores.nombreCompleto = nombre
  if (correoError) errores.correo = correoError
  if (contrasenaError) errores.contrasena = contrasenaError
  if (!confirmacion) {
    errores.confirmacion = 'Confirma tu contraseña.'
  } else if (contrasena !== confirmacion) {
    errores.confirmacion = 'Las contraseñas no coinciden.'
  }

  return errores
}

export function validarInicioSesion({ correo, contrasena }) {
  const errores = {}
  const correoError = validarCorreo(correo)
  if (correoError) errores.correo = correoError
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.'
  return errores
}
