import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationsPage } from './NotificationsPage'
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from '../features/notificaciones/notificaciones.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/notificaciones/notificaciones.api', () => ({
  listarNotificaciones: vi.fn(),
  marcarLeida: vi.fn(),
  marcarTodasLeidas: vi.fn(),
}))

const notificacion = {
  idNotificacion: 10,
  idSolicitud: 5,
  tipoCodigo: 'CAMBIO_ESTADO',
  titulo: 'Especialista asignado',
  mensaje: 'La solicitud fue asignada.',
  leida: false,
  fechaCreacion: '2026-11-25T01:00:00Z',
  fechaLectura: null,
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    listarNotificaciones.mockReset().mockResolvedValue({
      elementos: [notificacion],
      pagina: 1,
      tamanoPagina: 20,
      total: 1,
      noLeidas: 1,
    })
    marcarLeida.mockReset().mockResolvedValue(null)
    marcarTodasLeidas.mockReset().mockResolvedValue({ noLeidas: 0, actualizadas: 1 })
  })

  it('muestra avisos propios y permite marcar como leídos', async () => {
    const user = userEvent.setup()
    renderWithAuth(<NotificationsPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })

    expect(await screen.findByText('Especialista asignado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver solicitud/ }))
      .toHaveAttribute('href', '/app/solicitudes/5')

    await user.click(screen.getByRole('button', { name: 'Marcar leída' }))
    expect(marcarLeida).toHaveBeenCalledWith(10)

    await user.click(screen.getByRole('button', { name: /Marcar todas como leídas/ }))
    expect(marcarTodasLeidas).toHaveBeenCalled()
  })

  it('muestra el estado vacío', async () => {
    listarNotificaciones.mockResolvedValue({
      elementos: [],
      pagina: 1,
      tamanoPagina: 20,
      total: 0,
      noLeidas: 0,
    })
    renderWithAuth(<NotificationsPage />, {
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })
    expect(await screen.findByText('Sin notificaciones')).toBeInTheDocument()
  })
})
