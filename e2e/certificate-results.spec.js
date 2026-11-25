import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import {
  limpiarCertificadoNoAutentico,
  prepararCertificadoNoAutentico,
} from './helpers/sql.mjs'

const sufijo = Date.now()
const numero = `GX-E2E-NOAUTH-${sufijo}`
const folio = `SOL-NOAUTH-${sufijo}`
const token = randomUUID()
const correo = `e2e-certificado-noauth-${sufijo}@example.test`

test.beforeAll(async () => {
  prepararCertificadoNoAutentico(numero, token, correo, folio)
})

test.afterAll(async () => {
  limpiarCertificadoNoAutentico(folio, correo)
})

test('un certificado no auténtico se muestra como no auténtico y no acredita autenticidad', async ({ page }) => {
  await page.goto('/verificar')
  await page.getByLabel('Número o código').fill(numero)
  await page.getByRole('button', { name: /Verificar/ }).click()

  await expect(page.getByRole('heading', { name: numero })).toBeVisible()
  await expect(page.locator('.certificate-result strong')).toHaveText('No auténtico')
  await expect(page.locator('.certificate-result-danger')).toBeVisible()
  await expect(page.getByText(/no acredita la autenticidad/)).toBeVisible()
  await expect(page.getByText('Auténtico', { exact: true })).toHaveCount(0)
})
