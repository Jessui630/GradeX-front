import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewEvaluationPage } from './NewEvaluationPage'
import { listarCategorias, listarMarcas, obtenerRequisitos } from '../features/catalog/catalog.api'
import {
  crearSolicitud,
  enviarSolicitud,
  obtenerSolicitud,
  subirEvidencia,
} from '../features/solicitudes/solicitudes.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/catalog/catalog.api', () => ({
  listarCategorias: vi.fn(),
  listarMarcas: vi.fn(),
  obtenerRequisitos: vi.fn(),
}))
vi.mock('../features/solicitudes/solicitudes.api', () => ({
  crearSolicitud: vi.fn(),
  enviarSolicitud: vi.fn(),
  obtenerSolicitud: vi.fn(),
  subirEvidencia: vi.fn(),
}))

describe('NewEvaluationPage', () => {
  beforeEach(() => {
    listarCategorias.mockReset().mockResolvedValue([
      { idCategoria: 1, nombre: 'Sneakers', descripcion: 'Calzado' },
    ])
    listarMarcas.mockReset().mockResolvedValue([])
    obtenerRequisitos.mockReset().mockResolvedValue({
      campos: [{ campo: 'NOMBRE', obligatorio: true, longitudMaxima: 150, orden: 1 }],
      evidencias: [{
        idTipoEvidencia: 1,
        nombre: 'Vista general',
        obligatorio: true,
        cantidadMinima: 1,
        cantidadMaxima: 1,
        orden: 1,
      }],
    })
    crearSolicitud.mockReset().mockResolvedValue({
      idSolicitud: 5,
      folio: 'SOL-5',
      estadoCodigo: 'BORRADOR',
      estadoNombre: 'Borrador',
    })
    enviarSolicitud.mockReset()
    obtenerSolicitud.mockReset()
    subirEvidencia.mockReset()
  })

  it('selecciona categoría, valida el producto y crea el borrador', async () => {
    const user = userEvent.setup()
    renderWithAuth(<NewEvaluationPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    await user.click(await screen.findByRole('button', { name: /Sneakers/ }))
    expect(await screen.findByRole('heading', { name: /Datos del producto/ }))
      .toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Continuar a evidencia/ }))
    expect(await screen.findByText('Nombre del producto es obligatorio.'))
      .toBeInTheDocument()

    await user.type(screen.getByLabelText(/Nombre del producto/), 'Producto nuevo')
    await user.click(screen.getByRole('button', { name: /Continuar a evidencia/ }))

    expect(crearSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({ idCategoria: 1, nombre: 'Producto nuevo' }),
      expect.any(String),
    )
    expect(await screen.findByRole('heading', { name: /Adjunta la evidencia/ }))
      .toBeInTheDocument()
    expect(screen.getByText('Vista general')).toBeInTheDocument()
  })
})
