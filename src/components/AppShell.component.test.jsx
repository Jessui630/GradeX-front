import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { contarNoLeidas } from '../features/notificaciones/notificaciones.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/notificaciones/notificaciones.api', () => ({
  contarNoLeidas: vi.fn(),
}))

function RutasApp() {
  return (
    <Routes>
      <Route element={<AppShell />} path="/app">
        <Route element={<div>Contenido del panel</div>} index />
      </Route>
    </Routes>
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    contarNoLeidas.mockReset().mockResolvedValue({ noLeidas: 2 })
  })

  it('muestra la navegación de todos los roles y el contador de avisos', async () => {
    renderWithAuth(<RutasApp />, {
      route: '/app',
      usuario: {
        idUsuario: 1,
        nombreCompleto: 'Usuario Multirol',
        correo: 'multi@example.com',
        roles: ['Solicitante', 'Especialista', 'Administrador'],
      },
    })

    expect(await screen.findByText('Contenido del panel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nueva evaluación/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis solicitudes/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis certificados/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Asignaciones/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Administración/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Perfil/ })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Notificaciones/ }))
      .toBeInTheDocument()
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menú de cuenta' })).toBeInTheDocument()
  })
})
