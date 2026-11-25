import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../features/auth/auth-context'

export function renderWithAuth(
  ui,
  {
    usuario = null,
    cargando = false,
    errorSesion = null,
    route = '/app',
    auth = {},
  } = {},
) {
  const value = {
    usuario,
    cargando,
    errorSesion,
    iniciarSesion: vi.fn(),
    registrar: vi.fn(),
    cerrarSesion: vi.fn(),
    refrescarSesion: vi.fn(),
    ...auth,
  }

  return {
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
      </MemoryRouter>,
    ),
    auth: value,
  }
}
