import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfilePage } from './ProfilePage'
import {
  actualizarPerfil,
  cambiarContrasena,
  obtenerPerfil,
} from '../features/perfil/perfil.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/perfil/perfil.api', () => ({
  obtenerPerfil: vi.fn(),
  actualizarPerfil: vi.fn(),
  cambiarContrasena: vi.fn(),
}))

const perfil = {
  idUsuario: 1,
  nombreCompleto: 'Usuario de prueba',
  correo: 'usuario@example.com',
  recibirNotificaciones: true,
  roles: ['Solicitante'],
  fechaCreacion: '2026-11-01T00:00:00Z',
}

function RutasPerfil() {
  return (
    <Routes>
      <Route element={<ProfilePage />} path="/app/perfil" />
      <Route element={<div>Pantalla de acceso</div>} path="/login" />
    </Routes>
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    obtenerPerfil.mockReset().mockResolvedValue(perfil)
    actualizarPerfil.mockReset().mockResolvedValue({
      ...perfil,
      nombreCompleto: 'Usuario actualizado',
      recibirNotificaciones: false,
    })
    cambiarContrasena.mockReset().mockResolvedValue(null)
  })

  it('carga y actualiza los datos permitidos', async () => {
    const user = userEvent.setup()
    const refrescarSesion = vi.fn().mockResolvedValue({})
    renderWithAuth(<RutasPerfil />, {
      route: '/app/perfil',
      usuario: perfil,
      auth: { refrescarSesion },
    })

    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeInTheDocument()
    const nombre = screen.getByLabelText('Nombre completo')
    await user.clear(nombre)
    await user.type(nombre, 'Usuario actualizado')
    await user.click(screen.getByLabelText(/Recibir notificaciones/))
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }))

    expect(actualizarPerfil).toHaveBeenCalledWith({
      nombreCompleto: 'Usuario actualizado',
      recibirNotificaciones: false,
    })
    expect(refrescarSesion).toHaveBeenCalled()
    expect(await screen.findByText('Datos del perfil actualizados.')).toBeInTheDocument()
  })

  it('impide cambiar la contraseña si la confirmación no coincide', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RutasPerfil />, {
      route: '/app/perfil',
      usuario: perfil,
    })

    await screen.findByRole('heading', { name: 'Perfil' })
    await user.type(screen.getByLabelText('Contraseña actual'), 'Actual segura 2026!')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva segura 2026!')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Otra distinta 2026!')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }))

    expect(await screen.findByText('La confirmación no coincide.')).toBeInTheDocument()
    expect(cambiarContrasena).not.toHaveBeenCalled()
  })

  it('cambia la contraseña, cierra la sesión y navega al acceso', async () => {
    const user = userEvent.setup()
    const cerrarSesion = vi.fn().mockResolvedValue(undefined)
    renderWithAuth(<RutasPerfil />, {
      route: '/app/perfil',
      usuario: perfil,
      auth: { cerrarSesion },
    })

    await screen.findByRole('heading', { name: 'Perfil' })
    await user.type(screen.getByLabelText('Contraseña actual'), 'Actual segura 2026!')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva segura 2026!')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Nueva segura 2026!')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }))

    expect(cambiarContrasena).toHaveBeenCalledWith({
      contrasenaActual: 'Actual segura 2026!',
      contrasenaNueva: 'Nueva segura 2026!',
    })
    expect(cerrarSesion).toHaveBeenCalled()
    expect(await screen.findByText('Pantalla de acceso')).toBeInTheDocument()
  })
})
