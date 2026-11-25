import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from './auth-context'
import {
  cerrarSesion,
  iniciarSesion,
  obtenerSesionActual,
  registrarCuenta,
} from './auth.api'
import { ApiError } from '../../lib/ApiError'
import { render } from '@testing-library/react'

vi.mock('./auth.api', () => ({
  obtenerSesionActual: vi.fn(),
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
  registrarCuenta: vi.fn(),
}))

function Consumidor() {
  const {
    usuario,
    cargando,
    errorSesion,
    iniciarSesion: login,
    cerrarSesion: logout,
    refrescarSesion,
  } = useAuth()
  return (
    <div>
      <span>{cargando ? 'cargando' : usuario?.nombreCompleto ?? 'sin sesión'}</span>
      <span>{errorSesion ?? 'sin error'}</span>
      <button onClick={() => login({ correo: 'nuevo@example.com', contrasena: 'x' })}>
        iniciar
      </button>
      <button onClick={() => logout()}>cerrar</button>
      <button onClick={() => refrescarSesion()}>refrescar</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    obtenerSesionActual.mockReset().mockResolvedValue({
      idUsuario: 1,
      nombreCompleto: 'Usuario inicial',
      roles: ['Solicitante'],
    })
    iniciarSesion.mockReset().mockResolvedValue({
      idUsuario: 2,
      nombreCompleto: 'Usuario nuevo',
      roles: ['Solicitante'],
    })
    cerrarSesion.mockReset().mockResolvedValue(null)
    registrarCuenta.mockReset().mockResolvedValue({ idUsuario: 3 })
  })

  it('restaura la sesión y permite iniciar y cerrar sesión', async () => {
    const user = userEvent.setup()
    render(<AuthProvider><Consumidor /></AuthProvider>)

    expect(await screen.findByText('Usuario inicial')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    expect(await screen.findByText('Usuario nuevo')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'cerrar' }))
    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
  })

  it('no muestra error si la sesión no existe', async () => {
    obtenerSesionActual.mockRejectedValue(new ApiError('No autenticado', { status: 401 }))
    render(<AuthProvider><Consumidor /></AuthProvider>)
    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
    expect(screen.getByText('sin error')).toBeInTheDocument()
  })

  it('muestra error de sesión cuando el servicio falla', async () => {
    obtenerSesionActual.mockRejectedValue(
      new ApiError('Servicio no disponible', { status: 503 }),
    )
    render(<AuthProvider><Consumidor /></AuthProvider>)
    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
  })
})
