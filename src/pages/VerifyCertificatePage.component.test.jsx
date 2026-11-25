import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerifyCertificatePage } from './VerifyCertificatePage'
import {
  verificarCertificado,
  verificarCertificadoPorNumero,
} from '../features/certificados/certificados.api'
import { renderWithAuth } from '../testing/renderWithAuth'

vi.mock('../features/certificados/certificados.api', () => ({
  verificarCertificado: vi.fn(),
  verificarCertificadoPorNumero: vi.fn(),
}))

const publico = {
  numeroCertificado: 'GX-20261125-NOAUTH01',
  estadoCodigo: 'EMITIDO',
  estadoNombre: 'Emitido',
  nombreProducto: 'Producto no auténtico',
  modelo: 'Modelo Y',
  categoria: 'Sneakers',
  marca: null,
  dictamen: 'NO_AUTENTICO',
  conditionGrade: 4.5,
  fechaEmision: '2026-11-25T01:00:00Z',
  fechaVencimiento: null,
  especialista: 'Especialista de prueba',
  especialidad: 'Sneakers',
}

describe('VerifyCertificatePage', () => {
  beforeEach(() => {
    verificarCertificado.mockReset()
    verificarCertificadoPorNumero.mockReset()
  })

  it('verifica por número y muestra el dictamen no auténtico', async () => {
    verificarCertificadoPorNumero.mockResolvedValue(publico)
    const user = userEvent.setup()
    renderWithAuth(<VerifyCertificatePage />, { route: '/verificar' })

    await user.type(screen.getByLabelText('Número o código'), 'GX-20261125-NOAUTH01')
    await user.click(screen.getByRole('button', { name: /Verificar/ }))

    expect(verificarCertificadoPorNumero).toHaveBeenCalledWith('GX-20261125-NOAUTH01')
    expect(await screen.findByRole('heading', { name: publico.numeroCertificado }))
      .toBeInTheDocument()
    expect(screen.getByText('No auténtico', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('4.50 / 10')).toBeInTheDocument()
    expect(screen.getByText(/no acredita la autenticidad/)).toBeInTheDocument()
  })

  it('valida que el código no esté vacío', async () => {
    const user = userEvent.setup()
    renderWithAuth(<VerifyCertificatePage />, { route: '/verificar' })

    await user.click(screen.getByRole('button', { name: /Verificar/ }))
    expect(await screen.findByText(
      'Escribe el número de certificado o el código de verificación.',
    )).toBeInTheDocument()
  })

  it('carga automáticamente el certificado desde el enlace con token', async () => {
    verificarCertificado.mockResolvedValue(publico)
    renderWithAuth(
      <Routes>
        <Route element={<VerifyCertificatePage />} path="/verificar/:token" />
      </Routes>,
      { route: '/verificar/7a8ea714-73cc-435a-9ea8-6bb99e66dc18' },
    )

    expect(await screen.findByRole('heading', { name: publico.numeroCertificado }))
      .toBeInTheDocument()
    expect(verificarCertificado).toHaveBeenCalledWith(
      '7a8ea714-73cc-435a-9ea8-6bb99e66dc18',
    )
  })
})
