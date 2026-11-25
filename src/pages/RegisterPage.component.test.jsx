import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterPage } from './RegisterPage'
import { ApiError } from '../lib/ApiError'
import { renderWithAuth } from '../testing/renderWithAuth'

function RutasRegistro() {
  return (
    <Routes>
      <Route element={<RegisterPage />} path="/registro" />
      <Route element={<div>Pantalla de acceso</div>} path="/login" />
      <Route element={<div>Panel autenticado</div>} path="/app" />
    </Routes>
  )
}

describe('RegisterPage', () => {
  it('valida obligatorios y confirmación de contraseña', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RutasRegistro />, { route: '/registro' })

    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByText('Escribe tu nombre completo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText('Escribe una contraseña.')).toBeInTheDocument()
  })

  it('registra la cuenta y vuelve al acceso', async () => {
    const user = userEvent.setup()
    const registrar = vi.fn().mockResolvedValue({ idUsuario: 3 })
    renderWithAuth(<RutasRegistro />, { route: '/registro', auth: { registrar } })

    await user.type(screen.getByLabelText('Nombre completo'), 'Cuenta de prueba')
    await user.type(screen.getByLabelText('Correo electrónico'), 'cuenta@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Contraseña de prueba 2026')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Contraseña de prueba 2026')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(registrar).toHaveBeenCalledWith({
      nombreCompleto: 'Cuenta de prueba',
      correo: 'cuenta@example.com',
      contrasena: 'Contraseña de prueba 2026',
    })
    expect(await screen.findByText('Pantalla de acceso')).toBeInTheDocument()
  })

  it('muestra el error de correo duplicado en el campo', async () => {
    const user = userEvent.setup()
    const registrar = vi.fn().mockRejectedValue(new ApiError('Conflicto', {
      status: 409,
      errors: { correo: ['El correo ya está registrado.'] },
    }))
    renderWithAuth(<RutasRegistro />, { route: '/registro', auth: { registrar } })

    await user.type(screen.getByLabelText('Nombre completo'), 'Cuenta de prueba')
    await user.type(screen.getByLabelText('Correo electrónico'), 'cuenta@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Contraseña de prueba 2026')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Contraseña de prueba 2026')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument()
  })

  it('redirige si ya hay sesión', () => {
    renderWithAuth(<RutasRegistro />, {
      route: '/registro',
      usuario: { idUsuario: 1, roles: ['Solicitante'] },
    })
    expect(screen.getByText('Panel autenticado')).toBeInTheDocument()
  })
})
