import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyRequestsPage } from './MyRequestsPage'
import { listarSolicitudes } from '../features/solicitudes/solicitudes.api'
import { ApiError } from '../lib/ApiError'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/solicitudes/solicitudes.api', () => ({
  listarSolicitudes: vi.fn(),
}))

const solicitud = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  categoria: 'Sneakers',
  marca: 'Marca de prueba',
  estadoCodigo: 'PENDIENTE_ASIGNACION',
  estadoNombre: 'Pendiente de asignación',
  fechaSolicitud: '2026-11-25T01:00:00Z',
  evidenciasActivas: 1,
  accionPendiente: 'Espera la asignación de un especialista.',
}

describe('MyRequestsPage', () => {
  beforeEach(() => {
    listarSolicitudes.mockReset().mockResolvedValue({
      elementos: [solicitud],
      pagina: 1,
      tamanoPagina: 8,
      total: 1,
    })
  })

  it('lista las solicitudes propias y muestra su acción pendiente', async () => {
    renderWithAuth(<MyRequestsPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    expect(await screen.findByText('SOL-5')).toBeInTheDocument()
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de asignación')).toBeInTheDocument()
    expect(screen.getByText('Espera la asignación de un especialista.'))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nueva evaluación/ })).toBeInTheDocument()
  })

  it('filtra y muestra el estado vacío correspondiente', async () => {
    listarSolicitudes
      .mockResolvedValueOnce({
        elementos: [solicitud],
        pagina: 1,
        tamanoPagina: 8,
        total: 1,
      })
      .mockResolvedValueOnce({
        elementos: [],
        pagina: 1,
        tamanoPagina: 8,
        total: 0,
      })
    const user = userEvent.setup()
    renderWithAuth(<MyRequestsPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    await screen.findByText('SOL-5')
    await user.click(screen.getByRole('button', { name: 'Borradores' }))

    expect(listarSolicitudes).toHaveBeenLastCalledWith({
      pagina: 1,
      tamanoPagina: 8,
      estado: 'BORRADOR',
    })
    expect(await screen.findByText('No hay solicitudes con este filtro'))
      .toBeInTheDocument()
  })

  it('muestra un error comprensible', async () => {
    listarSolicitudes.mockRejectedValue(new ApiError('Fallo del servidor', { status: 500 }))
    renderWithAuth(<MyRequestsPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })
    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Ocurrió un error inesperado')
  })
})
