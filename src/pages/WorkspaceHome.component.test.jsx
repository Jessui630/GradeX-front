import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { WorkspaceHome } from './WorkspaceHome'
import { listarSolicitudes } from '../features/solicitudes/solicitudes.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/solicitudes/solicitudes.api', () => ({
  listarSolicitudes: vi.fn(),
}))

describe('WorkspaceHome', () => {
  beforeEach(() => {
    listarSolicitudes.mockReset().mockResolvedValue({
      elementos: [],
      pagina: 1,
      tamanoPagina: 3,
      total: 0,
    })
  })

  it('muestra las acciones del solicitante y su estado vacío', async () => {
    renderWithAuth(<WorkspaceHome />, {
      usuario: { idUsuario: 1, nombreCompleto: 'Ana Pérez', roles: ['Solicitante'] },
    })

    expect(await screen.findByText('Aún no tienes solicitudes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nueva evaluación/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis solicitudes/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis certificados/ })).toBeInTheDocument()
  })

  it('muestra el acceso a asignaciones para especialistas', () => {
    renderWithAuth(<WorkspaceHome />, {
      usuario: { idUsuario: 2, nombreCompleto: 'Eva', roles: ['Especialista'] },
    })

    expect(screen.getByRole('link', { name: /Mis asignaciones/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Notificaciones/ })).toBeInTheDocument()
  })

  it('muestra el acceso al panel para administradores', () => {
    renderWithAuth(<WorkspaceHome />, {
      usuario: { idUsuario: 3, nombreCompleto: 'Admin', roles: ['Administrador'] },
    })

    expect(screen.getByRole('link', { name: /Panel administrativo/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Notificaciones/ })).toBeInTheDocument()
  })
})
