import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpecialistAssignmentsPage } from './SpecialistAssignmentsPage'
import { listarAsignaciones } from '../features/especialista/especialista.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/especialista/especialista.api', () => ({
  listarAsignaciones: vi.fn(),
}))

const asignacion = {
  idSolicitud: 5,
  folio: 'SOL-5',
  nombreProducto: 'Producto de prueba',
  categoria: 'Sneakers',
  marca: 'Marca',
  estadoCodigo: 'ASIGNADA',
  estadoNombre: 'Asignada',
  fechaSolicitud: '2026-11-25T01:00:00Z',
  fechaAsignacion: '2026-11-25T02:00:00Z',
  evidenciasActivas: 2,
  evaluacionIniciada: false,
  fechaFinalizacion: null,
}

describe('SpecialistAssignmentsPage', () => {
  beforeEach(() => {
    listarAsignaciones.mockReset().mockResolvedValue({
      elementos: [asignacion],
      pagina: 1,
      tamanoPagina: 10,
      total: 1,
    })
  })

  it('muestra las asignaciones propias y filtra por estado', async () => {
    const user = userEvent.setup()
    renderWithAuth(<SpecialistAssignmentsPage />, {
      usuario: { idUsuario: 2, roles: ['Especialista'] },
    })

    expect(await screen.findByText('SOL-5')).toBeInTheDocument()
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument()
    expect(screen.getByText('Asignada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SOL-5/ }))
      .toHaveAttribute('href', '/app/especialista/asignaciones/5')

    await user.click(screen.getByRole('button', { name: 'Finalizadas' }))
    expect(listarAsignaciones).toHaveBeenLastCalledWith({
      pagina: 1,
      tamanoPagina: 10,
      estado: 'FINALIZADA',
    })
  })
})
