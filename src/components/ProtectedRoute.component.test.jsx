import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import { renderWithAuth } from '../testing/renderWithAuth'

function RutasProtegidas() {
  return (
    <Routes>
      <Route element={<div>Pantalla de acceso</div>} path="/login" />
      <Route
        element={
          <ProtectedRoute>
            <div>Zona privada</div>
          </ProtectedRoute>
        }
        path="/app"
      />
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('redirige al login cuando no hay sesión', () => {
    renderWithAuth(<RutasProtegidas />, { route: '/app', usuario: null })
    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument()
  })

  it('muestra el contenido cuando hay sesión', () => {
    renderWithAuth(<RutasProtegidas />, {
      route: '/app',
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })
    expect(screen.getByText('Zona privada')).toBeInTheDocument()
  })

  it('muestra el estado de carga mientras comprueba la sesión', () => {
    renderWithAuth(<RutasProtegidas />, { route: '/app', cargando: true })
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando tu sesión')
  })
})
