import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'
import { ApiError } from '../lib/ApiError'
import { renderWithAuth } from '../testing/renderWithAuth'

function RutasLogin() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<div>Panel autenticado</div>} path="/app" />
    </Routes>
  )
}

describe('LoginPage', () => {
  it('valida los campos obligatorios antes de enviar', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RutasLogin />, { route: '/login' })

    await user.click(screen.getByRole('button', { name: /Entrar a GradeX/ }))

    expect(await screen.findByText('Escribe tu correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
  })

  it('inicia sesión y navega al panel', async () => {
    const user = userEvent.setup()
    const iniciarSesion = vi.fn().mockResolvedValue({
      idUsuario: 7,
      nombreCompleto: 'Usuario',
      roles: ['Solicitante'],
    })
    renderWithAuth(<RutasLogin />, { route: '/login', auth: { iniciarSesion } })

    await user.type(screen.getByLabelText('Correo electrónico'), ' usuario@example.com ')
    await user.type(screen.getByLabelText('Contraseña'), 'Contraseña de prueba 2026')
    await user.click(screen.getByRole('button', { name: /Entrar a GradeX/ }))

    expect(iniciarSesion).toHaveBeenCalledWith({
      correo: 'usuario@example.com',
      contrasena: 'Contraseña de prueba 2026',
    })
    expect(await screen.findByText('Panel autenticado')).toBeInTheDocument()
  })

  it('muestra un mensaje seguro cuando las credenciales no coinciden', async () => {
    const user = userEvent.setup()
    const iniciarSesion = vi.fn().mockRejectedValue(
      new ApiError('El correo o la contraseña no son correctos.', { status: 401 }),
    )
    renderWithAuth(<RutasLogin />, { route: '/login', auth: { iniciarSesion } })

    await user.type(screen.getByLabelText('Correo electrónico'), 'usuario@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Contraseña de prueba 2026')
    await user.click(screen.getByRole('button', { name: /Entrar a GradeX/ }))

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('El correo o la contraseña no son correctos.')
  })

  it('redirige al panel si ya existe una sesión', () => {
    renderWithAuth(<RutasLogin />, {
      route: '/login',
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })
    expect(screen.getByText('Panel autenticado')).toBeInTheDocument()
  })
})
