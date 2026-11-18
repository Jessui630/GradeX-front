import { apiFetch } from '../../lib/api'

export function listarSolicitudesAsignacion({ pagina = 1, tamanoPagina = 20, estado } = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  })
  if (estado) parametros.set('estado', estado)
  return apiFetch(`/administracion/solicitudes?${parametros.toString()}`)
}

export function obtenerSolicitudAsignacion(idSolicitud) {
  return apiFetch(`/administracion/solicitudes/${idSolicitud}`)
}

export function listarCompatibles(idSolicitud) {
  return apiFetch(`/administracion/solicitudes/${idSolicitud}/especialistas-compatibles`)
}

export function asignarEspecialista(idSolicitud, idEspecialista) {
  return apiFetch(`/administracion/solicitudes/${idSolicitud}/asignacion`, {
    method: 'POST',
    body: { idEspecialista },
    csrf: true,
  })
}

export function listarCategoriasAdmin() {
  return apiFetch('/administracion/catalogo/categorias')
}

export function crearCategoria(datos) {
  return apiFetch('/administracion/catalogo/categorias', {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function actualizarCategoria(idCategoria, datos) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function listarMarcasAdmin() {
  return apiFetch('/administracion/catalogo/marcas')
}

export function crearMarca(datos) {
  return apiFetch('/administracion/catalogo/marcas', {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function actualizarMarca(idMarca, datos) {
  return apiFetch(`/administracion/catalogo/marcas/${idMarca}`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function listarTiposEvidenciaAdmin() {
  return apiFetch('/administracion/catalogo/tipos-evidencia')
}

export function listarCategoriaMarcas(idCategoria) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/marcas`)
}

export function vincularMarca(idCategoria, idMarca, activa) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/marcas/${idMarca}`, {
    method: 'PUT',
    body: { activa },
    csrf: true,
  })
}

export function obtenerRequisitosAdmin(idCategoria) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/requisitos`)
}

export function actualizarRequisitos(idCategoria, datos) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/requisitos`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function listarCriterios(idCategoria) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/criterios`)
}

export function crearCriterio(idCategoria, datos) {
  return apiFetch(`/administracion/catalogo/categorias/${idCategoria}/criterios`, {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function actualizarCriterio(idCriterio, datos) {
  return apiFetch(`/administracion/catalogo/criterios/${idCriterio}`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}

export function listarEspecialistasAdmin() {
  return apiFetch('/administracion/especialistas')
}

export function buscarUsuariosEspecialista(buscar) {
  const parametros = new URLSearchParams()
  if (buscar) parametros.set('buscar', buscar)
  return apiFetch(`/administracion/especialistas/usuarios?${parametros.toString()}`)
}

export function crearEspecialista(datos) {
  return apiFetch('/administracion/especialistas', {
    method: 'POST',
    body: datos,
    csrf: true,
  })
}

export function actualizarEspecialista(idEspecialista, datos) {
  return apiFetch(`/administracion/especialistas/${idEspecialista}`, {
    method: 'PUT',
    body: datos,
    csrf: true,
  })
}
