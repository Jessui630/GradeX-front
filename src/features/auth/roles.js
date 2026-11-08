export const ROLE = {
  SOLICITANTE: 'Solicitante',
  ESPECIALISTA: 'Especialista',
  ADMINISTRADOR: 'Administrador',
}

export function normalizarRol(rol) {
  return (rol ?? '').trim().toLowerCase()
}

export function tieneRol(usuario, rol) {
  return Boolean(
    usuario?.roles?.some((actual) => normalizarRol(actual) === normalizarRol(rol)),
  )
}

export function etiquetaRol(rol) {
  const normalizado = normalizarRol(rol)
  if (normalizado === 'solicitante') return 'Solicitante'
  if (normalizado === 'especialista') return 'Especialista'
  if (normalizado === 'administrador') return 'Administrador'
  return rol
}
