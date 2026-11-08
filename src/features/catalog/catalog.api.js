import { apiFetch } from '../../lib/api'

export function listarCategorias() {
  return apiFetch('/catalogo/categorias')
}

export function listarMarcas(idCategoria) {
  return apiFetch(`/catalogo/categorias/${idCategoria}/marcas`)
}

export function obtenerRequisitos(idCategoria) {
  return apiFetch(`/catalogo/categorias/${idCategoria}/requisitos`)
}
