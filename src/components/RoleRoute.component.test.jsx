import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { RoleRoute } from './RoleRoute'
import { ROLE } from '../features/auth/roles'
import { renderWithAuth } from '../testing/renderWithAuth'

describe('RoleRoute', () => {
  it('permite el contenido al rol autorizado', () => {
    renderWithAuth(
      <RoleRoute role={ROLE.ADMINISTRADOR}>
        <div>Panel administrativo</div>
      </RoleRoute>,
      { usuario: { idUsuario: 1, roles: ['administrador'] } },
    )
    expect(screen.getByText('Panel administrativo')).toBeInTheDocument()
  })

  it('deniega el contenido a un rol distinto', () => {
    renderWithAuth(
      <RoleRoute role={ROLE.ADMINISTRADOR}>
        <div>Panel administrativo</div>
      </RoleRoute>,
      { usuario: { idUsuario: 1, roles: ['Solicitante'] } },
    )
    expect(screen.getByRole('heading', {
      name: 'Esta área no está disponible para tu rol',
    })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver a mi panel/ })).toBeInTheDocument()
  })
})
